#!/usr/bin/env python3
"""Safely release completed Agent Mesh claim branches.

A claim branch is deleted only when it is provably safe:
- its roadmap issue is CLOSED; and
- there is no open PR for the branch; and
- either a merged PR exists for that exact head branch OR the branch is not ahead of main.

Anything ambiguous or containing unmerged work is preserved.
"""

import argparse
import json
import os
import re
import subprocess
import sys

CLAIM_PREFIX = "refs/heads/agent/"
SUBGOAL_RE = re.compile(r"^TZ-(?:G00|ROADMAP-\d+)-SG-\d+$")
TITLE_RE = re.compile(r"^\[([A-Z0-9-]+-SG-\d+)\]")


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def classify_release(*, issue_state, open_pr, merged_pr, ahead_by):
    if issue_state is None:
        return "PRESERVE_MISSING_ISSUE"
    if issue_state == "OPEN":
        return "PRESERVE_OPEN_ISSUE"
    if open_pr:
        return "PRESERVE_OPEN_PR"
    if merged_pr:
        return "RELEASE_MERGED"
    if ahead_by == 0:
        return "RELEASE_NO_UNMERGED_COMMITS"
    return "PRESERVE_CLOSED_WITH_UNMERGED_WORK"


def self_test():
    assert classify_release(
        issue_state="OPEN", open_pr=False, merged_pr=False, ahead_by=0
    ) == "PRESERVE_OPEN_ISSUE"
    assert classify_release(
        issue_state="CLOSED", open_pr=True, merged_pr=False, ahead_by=0
    ) == "PRESERVE_OPEN_PR"
    assert classify_release(
        issue_state="CLOSED", open_pr=False, merged_pr=True, ahead_by=3
    ) == "RELEASE_MERGED"
    assert classify_release(
        issue_state="CLOSED", open_pr=False, merged_pr=False, ahead_by=0
    ) == "RELEASE_NO_UNMERGED_COMMITS"
    assert classify_release(
        issue_state="CLOSED", open_pr=False, merged_pr=False, ahead_by=2
    ) == "PRESERVE_CLOSED_WITH_UNMERGED_WORK"
    assert classify_release(
        issue_state=None, open_pr=False, merged_pr=False, ahead_by=0
    ) == "PRESERVE_MISSING_ISSUE"
    print("release-safe-agent-claims self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually delete safe claim refs")
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

    issues = run_json([
        "gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", "1000",
        "--json", "number,title,state,url"
    ]) or []
    issue_by_sid = {}
    for issue in issues:
        match = TITLE_RE.match(issue.get("title") or "")
        if match and match.group(1) not in issue_by_sid:
            issue_by_sid[match.group(1)] = issue

    prs = run_json([
        "gh", "pr", "list", "--repo", repo, "--state", "all", "--limit", "1000",
        "--json", "number,headRefName,state,mergedAt,url,title"
    ]) or []
    prs_by_branch = {}
    for pr in prs:
        branch = pr.get("headRefName")
        if branch:
            prs_by_branch.setdefault(branch, []).append(pr)

    records = []
    deleted = 0
    releasable = 0

    for ref in refs:
        full_ref = ref.get("ref") or ""
        if not full_ref.startswith(CLAIM_PREFIX):
            continue
        sid = full_ref[len(CLAIM_PREFIX):]
        branch = f"agent/{sid}"

        if not SUBGOAL_RE.match(sid):
            records.append({
                "subgoal_id": sid,
                "branch": branch,
                "classification": "PRESERVE_INVALID_CLAIM_BRANCH",
                "deleted": False,
            })
            continue

        issue = issue_by_sid.get(sid)
        branch_prs = prs_by_branch.get(branch, [])
        open_pr = next((p for p in branch_prs if p.get("state") == "OPEN"), None)
        merged_pr = next((p for p in branch_prs if p.get("mergedAt")), None)

        compare = run_json(["gh", "api", f"repos/{repo}/compare/main...{branch}"])
        ahead_by = int(compare.get("ahead_by") or 0)
        behind_by = int(compare.get("behind_by") or 0)

        classification = classify_release(
            issue_state=issue.get("state") if issue else None,
            open_pr=bool(open_pr),
            merged_pr=bool(merged_pr),
            ahead_by=ahead_by,
        )

        safe = classification.startswith("RELEASE_")
        if safe:
            releasable += 1

        did_delete = False
        if safe and args.apply:
            delete = run([
                "gh", "api",
                "--method", "DELETE",
                f"repos/{repo}/git/refs/heads/agent/{sid}",
            ], check=False)
            if delete.returncode != 0:
                raise RuntimeError(
                    f"Failed deleting {branch}: "
                    f"{(delete.stderr or delete.stdout or '').strip()}"
                )
            deleted += 1
            did_delete = True

        records.append({
            "subgoal_id": sid,
            "branch": branch,
            "issue_number": issue.get("number") if issue else None,
            "issue_state": issue.get("state") if issue else None,
            "open_pr_number": open_pr.get("number") if open_pr else None,
            "merged_pr_number": merged_pr.get("number") if merged_pr else None,
            "ahead_by": ahead_by,
            "behind_by": behind_by,
            "classification": classification,
            "deleted": did_delete,
        })

    payload = {
        "repo": repo,
        "apply": args.apply,
        "claim_count": len(records),
        "releasable_count": releasable,
        "deleted_count": deleted,
        "claims": records,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        mode = "APPLY" if args.apply else "DRY-RUN"
        print(
            f"Safe claim release ({mode}): "
            f"{len(records)} claim(s), {releasable} releasable, {deleted} deleted"
        )
        for r in records:
            print(
                f"- {r['classification']}: {r['branch']} "
                f"issue=#{r.get('issue_number')} open_pr=#{r.get('open_pr_number')} "
                f"merged_pr=#{r.get('merged_pr_number')} ahead={r.get('ahead_by')} "
                f"deleted={r.get('deleted')}"
            )

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## Safe Agent Claim Release\n\n")
            f.write(f"- Mode: **{'apply' if args.apply else 'dry-run'}**\n")
            f.write(f"- Claim branches: **{len(records)}**\n")
            f.write(f"- Releasable: **{releasable}**\n")
            f.write(f"- Deleted: **{deleted}**\n\n")
            if records:
                f.write("| Claim | Issue | Open PR | Merged PR | Ahead | Result |\n")
                f.write("|---|---:|---:|---:|---:|---|\n")
                for r in records:
                    f.write(
                        f"| `{r['subgoal_id']}` | {r.get('issue_number') or '-'} | "
                        f"{r.get('open_pr_number') or '-'} | {r.get('merged_pr_number') or '-'} | "
                        f"{r.get('ahead_by') or 0} | {r['classification']} |\n"
                    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
