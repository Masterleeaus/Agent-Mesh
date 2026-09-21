#!/usr/bin/env python3
"""Build a read-only Manager queue from live Agent Mesh GitHub state."""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ROOT / "roadmap" / "SUBGOAL-ISSUE-MANIFEST.json"
READINESS = ROOT / ".github" / "scripts" / "manager-review-readiness.py"
CLAIM_AUDIT = ROOT / ".github" / "scripts" / "audit-agent-claims.py"

STATE_RANK = {"READY": 0, "BLOCKED": 1, "WAITING": 2}
PRIORITY_RANK = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def goal_number(goal_id):
    if goal_id == "TZ-G00":
        return 0
    match = re.search(r"(\d+)$", goal_id or "")
    return int(match.group(1)) if match else 999999


def subgoal_number(subgoal_id):
    match = re.search(r"SG-(\d+)$", subgoal_id or "")
    return int(match.group(1)) if match else 999999


def priority_number(value):
    return PRIORITY_RANK.get(str(value or "").upper(), 99)


def queue_sort_key(item):
    return (
        STATE_RANK.get(item.get("state"), 99),
        priority_number(item.get("priority")),
        goal_number(item.get("goal_id")),
        subgoal_number(item.get("subgoal_id")),
        int(item.get("pr_number") or 999999),
    )


def build_queue(readiness, manifest, issue_by_sid):
    manifest_by_sid = {item.get("subgoal_id"): item for item in manifest if item.get("subgoal_id")}
    items = []

    for pr in readiness.get("prs", []):
        sid = pr.get("subgoal_id")
        roadmap = manifest_by_sid.get(sid, {})
        issue = issue_by_sid.get(sid, {})
        items.append({
            "state": pr.get("state"),
            "pr_number": pr.get("pr_number"),
            "pr_url": pr.get("pr_url"),
            "subgoal_id": sid,
            "goal_id": roadmap.get("goal_id") or (sid.rsplit("-SG-", 1)[0] if sid else None),
            "priority": roadmap.get("priority"),
            "title": roadmap.get("title"),
            "roadmap_status": roadmap.get("status"),
            "issue_number": issue.get("number"),
            "issue_url": issue.get("url"),
            "draft": pr.get("draft"),
            "mergeable_state": pr.get("mergeable_state"),
            "head_sha": pr.get("head_sha"),
            "reasons": pr.get("reasons") or [],
        })

    items.sort(key=queue_sort_key)
    return items


def self_test():
    manifest = [
        {"subgoal_id": "TZ-ROADMAP-02-SG-02", "goal_id": "TZ-ROADMAP-02", "priority": "P1", "title": "B", "status": "TODO"},
        {"subgoal_id": "TZ-ROADMAP-01-SG-03", "goal_id": "TZ-ROADMAP-01", "priority": "P0", "title": "A", "status": "TODO"},
        {"subgoal_id": "TZ-ROADMAP-03-SG-01", "goal_id": "TZ-ROADMAP-03", "priority": "P0", "title": "C", "status": "TODO"},
    ]
    readiness = {
        "prs": [
            {"state": "WAITING", "pr_number": 3, "subgoal_id": "TZ-ROADMAP-01-SG-03", "reasons": ["draft"]},
            {"state": "READY", "pr_number": 2, "subgoal_id": "TZ-ROADMAP-02-SG-02", "reasons": []},
            {"state": "READY", "pr_number": 1, "subgoal_id": "TZ-ROADMAP-03-SG-01", "reasons": []},
        ]
    }
    issues = {
        "TZ-ROADMAP-01-SG-03": {"number": 11},
        "TZ-ROADMAP-02-SG-02": {"number": 12},
        "TZ-ROADMAP-03-SG-01": {"number": 13},
    }
    queue = build_queue(readiness, manifest, issues)
    assert [item["pr_number"] for item in queue] == [1, 2, 3]
    assert queue[0]["priority"] == "P0"
    assert queue[-1]["state"] == "WAITING"
    print("manager-review-queue self-test OK")


def main():
    parser = argparse.ArgumentParser()
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

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    readiness = run_json([
        "python3", str(READINESS), "--json"
    ])

    claim_audit = run_json([
        "python3", str(CLAIM_AUDIT), "--stale-hours", "24", "--json"
    ])

    issues = run_json([
        "gh", "issue", "list",
        "--repo", repo,
        "--state", "all",
        "--limit", "1000",
        "--json", "number,title,state,url",
    ]) or []
    issue_by_sid = {}
    for issue in issues:
        match = re.match(r"^\[([A-Z0-9-]+-SG-\d+)\]", issue.get("title") or "")
        if match and match.group(1) not in issue_by_sid:
            issue_by_sid[match.group(1)] = issue

    queue = build_queue(readiness, manifest, issue_by_sid)

    active_without_pr = [
        item for item in claim_audit.get("claims", [])
        if item.get("classification") in {"ACTIVE_CLAIM", "ACTIVE_UNMERGED_WORK"}
        and not item.get("open_pr_number")
    ]
    claim_problems = [
        item for item in claim_audit.get("claims", [])
        if item.get("classification") in {
            "STALE_NO_PR",
            "ORPHAN_NO_CLAIM_RECORD",
            "ORPHAN_MISSING_ISSUE",
            "RELEASABLE_CLOSED_ISSUE",
            "INVALID_CLAIM_BRANCH",
        }
    ]

    payload = {
        "repo": repo,
        "ready_count": sum(1 for item in queue if item["state"] == "READY"),
        "blocked_count": sum(1 for item in queue if item["state"] == "BLOCKED"),
        "waiting_count": sum(1 for item in queue if item["state"] == "WAITING"),
        "active_claims_without_pr_count": len(active_without_pr),
        "claim_problem_count": len(claim_problems),
        "review_queue": queue,
        "active_claims_without_pr": active_without_pr,
        "claim_problems": claim_problems,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(
            "Manager queue: "
            f"{payload['ready_count']} READY, "
            f"{payload['blocked_count']} BLOCKED, "
            f"{payload['waiting_count']} WAITING, "
            f"{payload['active_claims_without_pr_count']} active claim(s) without PR, "
            f"{payload['claim_problem_count']} claim problem(s)"
        )
        for item in queue:
            reason = "; ".join(item["reasons"]) if item["reasons"] else "review prerequisites satisfied"
            print(
                f"- {item['state']}: PR #{item['pr_number']} "
                f"{item['subgoal_id']} [{item.get('priority') or '-'}] — {reason}"
            )
        for claim in active_without_pr:
            print(
                f"- CLAIM-NO-PR: {claim['subgoal_id']} issue=#{claim.get('issue_number')} "
                f"ahead={claim.get('ahead_by')} age_h={claim.get('claim_age_hours')}"
            )
        for claim in claim_problems:
            print(
                f"- CLAIM-PROBLEM: {claim['classification']} {claim.get('subgoal_id')}"
            )

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with Path(summary).open("a", encoding="utf-8") as f:
            f.write("## Agent Mesh Manager Queue\n\n")
            f.write(f"- READY: **{payload['ready_count']}**\n")
            f.write(f"- BLOCKED: **{payload['blocked_count']}**\n")
            f.write(f"- WAITING: **{payload['waiting_count']}**\n")
            f.write(f"- Active claims without PR: **{payload['active_claims_without_pr_count']}**\n")
            f.write(f"- Claim problems: **{payload['claim_problem_count']}**\n\n")

            if queue:
                f.write("| State | Priority | Subgoal | Issue | PR | Reason |\n")
                f.write("|---|---|---|---:|---:|---|\n")
                for item in queue:
                    reason = "; ".join(item["reasons"]) if item["reasons"] else "ready"
                    f.write(
                        f"| **{item['state']}** | {item.get('priority') or '-'} | "
                        f"`{item['subgoal_id']}` | {item.get('issue_number') or '-'} | "
                        f"{item.get('pr_number') or '-'} | {reason} |\n"
                    )
                f.write("\n")

            if active_without_pr:
                f.write("### Active claims without PR\n\n")
                for claim in active_without_pr:
                    f.write(
                        f"- `{claim['subgoal_id']}` — issue #{claim.get('issue_number') or '-'}, "
                        f"ahead {claim.get('ahead_by') or 0}, age {claim.get('claim_age_hours') or '-'}h\n"
                    )
                f.write("\n")

            if claim_problems:
                f.write("### Claim problems requiring Manager attention\n\n")
                for claim in claim_problems:
                    f.write(
                        f"- **{claim['classification']}** — `{claim.get('subgoal_id') or claim.get('branch')}`\n"
                    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
