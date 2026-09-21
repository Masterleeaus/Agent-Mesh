#!/usr/bin/env python3
"""Audit live Agent Mesh claim branches without mutating them."""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

CLAIM_PREFIX = "refs/heads/agent/"
SUBGOAL_RE = re.compile(r"^TZ-(?:G00|ROADMAP-\d+)-SG-\d+$")
CLAIM_MARKERS = ("### Agent Mesh claim", "CLAIM:")


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def parse_dt(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def classify_claim(*, issue_state, open_pr, age_hours, has_claim_comment, ahead_by, stale_hours):
    if issue_state is None:
        return "ORPHAN_MISSING_ISSUE"
    if issue_state != "OPEN":
        return "RELEASABLE_CLOSED_ISSUE"
    if open_pr:
        return "ACTIVE_PR"
    if ahead_by and ahead_by > 0:
        return "ACTIVE_UNMERGED_WORK"
    if not has_claim_comment:
        return "ORPHAN_NO_CLAIM_RECORD"
    if age_hours is not None and age_hours >= stale_hours:
        return "STALE_NO_PR"
    return "ACTIVE_CLAIM"


def self_test():
    assert classify_claim(
        issue_state="OPEN", open_pr=True, age_hours=99, has_claim_comment=True,
        ahead_by=2, stale_hours=24
    ) == "ACTIVE_PR"
    assert classify_claim(
        issue_state="CLOSED", open_pr=False, age_hours=1, has_claim_comment=True,
        ahead_by=0, stale_hours=24
    ) == "RELEASABLE_CLOSED_ISSUE"
    assert classify_claim(
        issue_state="OPEN", open_pr=False, age_hours=30, has_claim_comment=True,
        ahead_by=0, stale_hours=24
    ) == "STALE_NO_PR"
    assert classify_claim(
        issue_state="OPEN", open_pr=False, age_hours=40, has_claim_comment=True,
        ahead_by=1, stale_hours=24
    ) == "ACTIVE_UNMERGED_WORK"
    assert classify_claim(
        issue_state=None, open_pr=False, age_hours=1, has_claim_comment=False,
        ahead_by=0, stale_hours=24
    ) == "ORPHAN_MISSING_ISSUE"
    print("audit-agent-claims self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stale-hours", type=float, default=24.0)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        repo = run([
            "gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"
        ]).stdout.strip()

    refs = run_json(["gh", "api", f"repos/{repo}/git/matching-refs/heads/agent/"]) or []
    open_prs = run_json([
        "gh", "pr", "list", "--repo", repo, "--state", "open", "--limit", "500",
        "--json", "number,headRefName,url,title"
    ]) or []
    prs_by_branch = {p["headRefName"]: p for p in open_prs if p.get("headRefName")}

    issues = run_json([
        "gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", "1000",
        "--json", "number,title,state,url"
    ]) or []
    issue_by_sid = {}
    for issue in issues:
        m = re.match(r"^\[([A-Z0-9-]+-SG-\d+)\]", issue.get("title") or "")
        if m and m.group(1) not in issue_by_sid:
            issue_by_sid[m.group(1)] = issue

    now = datetime.now(timezone.utc)
    records = []

    for ref in refs:
        full_ref = ref.get("ref") or ""
        if not full_ref.startswith(CLAIM_PREFIX):
            continue
        sid = full_ref[len(CLAIM_PREFIX):]
        if not SUBGOAL_RE.match(sid):
            records.append({
                "subgoal_id": sid,
                "branch": full_ref.replace("refs/heads/", "", 1),
                "classification": "INVALID_CLAIM_BRANCH",
            })
            continue

        branch = f"agent/{sid}"
        issue = issue_by_sid.get(sid)
        pr = prs_by_branch.get(branch)

        compare = run_json([
            "gh", "api", f"repos/{repo}/compare/main...{branch}"
        ])
        ahead_by = int(compare.get("ahead_by") or 0)
        behind_by = int(compare.get("behind_by") or 0)

        latest_claim_at = None
        has_claim_comment = False
        if issue:
            comments = run_json([
                "gh", "api", "--paginate",
                f"repos/{repo}/issues/{issue['number']}/comments"
            ]) or []
            for comment in comments:
                body = comment.get("body") or ""
                if any(marker in body for marker in CLAIM_MARKERS):
                    has_claim_comment = True
                    created = parse_dt(comment.get("created_at"))
                    if created and (latest_claim_at is None or created > latest_claim_at):
                        latest_claim_at = created

        if latest_claim_at is None:
            # Fallback only for age reporting; absence of a claim comment remains explicit.
            commit = run_json(["gh", "api", f"repos/{repo}/commits/{ref['object']['sha']}"])
            latest_claim_at = parse_dt(
                ((commit.get("commit") or {}).get("committer") or {}).get("date")
            )

        age_hours = None
        if latest_claim_at:
            age_hours = round((now - latest_claim_at).total_seconds() / 3600, 2)

        issue_state = issue.get("state") if issue else None
        classification = classify_claim(
            issue_state=issue_state,
            open_pr=bool(pr),
            age_hours=age_hours,
            has_claim_comment=has_claim_comment,
            ahead_by=ahead_by,
            stale_hours=args.stale_hours,
        )

        records.append({
            "subgoal_id": sid,
            "branch": branch,
            "issue_number": issue.get("number") if issue else None,
            "issue_state": issue_state,
            "issue_url": issue.get("url") if issue else None,
            "open_pr_number": pr.get("number") if pr else None,
            "open_pr_url": pr.get("url") if pr else None,
            "ahead_by": ahead_by,
            "behind_by": behind_by,
            "claim_age_hours": age_hours,
            "claim_comment_found": has_claim_comment,
            "classification": classification,
        })

    bad = {
        "INVALID_CLAIM_BRANCH",
        "ORPHAN_MISSING_ISSUE",
        "ORPHAN_NO_CLAIM_RECORD",
        "RELEASABLE_CLOSED_ISSUE",
        "STALE_NO_PR",
    }
    problem_count = sum(1 for r in records if r["classification"] in bad)

    payload = {
        "repo": repo,
        "stale_hours": args.stale_hours,
        "claim_count": len(records),
        "problem_count": problem_count,
        "claims": records,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"Agent claim audit: {len(records)} claim branch(es), {problem_count} problem(s)")
        for record in records:
            print(
                f"- {record['classification']}: {record['branch']} "
                f"issue=#{record.get('issue_number')} pr=#{record.get('open_pr_number')} "
                f"ahead={record.get('ahead_by')} behind={record.get('behind_by')} "
                f"age_h={record.get('claim_age_hours')}"
            )

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with Path(summary).open("a", encoding="utf-8") as f:
            f.write("## Agent Mesh claim audit\n\n")
            f.write(f"- Claims: **{len(records)}**\n")
            f.write(f"- Problems: **{problem_count}**\n")
            f.write(f"- Stale threshold: **{args.stale_hours}h**\n\n")
            if records:
                f.write("| Claim | Issue | PR | Ahead | Behind | Age h | State |\n")
                f.write("|---|---:|---:|---:|---:|---:|---|\n")
                for r in records:
                    f.write(
                        f"| `{r['subgoal_id']}` | {r.get('issue_number') or '-'} | "
                        f"{r.get('open_pr_number') or '-'} | {r.get('ahead_by') or 0} | "
                        f"{r.get('behind_by') or 0} | {r.get('claim_age_hours') or '-'} | "
                        f"{r['classification']} |\n"
                    )

    if args.strict and problem_count:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
