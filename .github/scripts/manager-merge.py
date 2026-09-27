#!/usr/bin/env python3
"""Guarded manual Manager merge for canonical Agent Mesh implementation PRs.

This script never auto-selects a PR and never runs automatically. A Manager must
explicitly supply a PR number and --apply. The merge is rejected unless the
exact current PR head is READY and all canonical checks are green.
"""

import argparse
import json
import os
import re
import subprocess
import sys

BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
ISSUE_RE = re.compile(r"(?im)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b")
READINESS_CONTEXT = "Agent Mesh / Manager Review Readiness"
REQUIRED_WORKFLOWS = ("Titan Zero CI", "Agent Claim Gate")


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def latest_by_name(runs):
    latest = {}
    for item in sorted(runs, key=lambda x: x.get("created_at") or "", reverse=True):
        name = item.get("name")
        if name and name not in latest:
            latest[name] = item
    return latest


def latest_status_by_context(statuses):
    latest = {}
    for item in statuses:
        context = item.get("context")
        if context and context not in latest:
            latest[context] = item
    return latest


def evaluate(*, pr, issue, statuses, workflow_runs, expected_head_sha=None):
    blockers = []

    number = int(pr.get("number") or 0)
    state = str(pr.get("state") or "").upper()
    merged = bool(pr.get("merged"))
    draft = bool(pr.get("draft"))
    base = ((pr.get("base") or {}).get("ref")) or ""
    head = ((pr.get("head") or {}).get("ref")) or ""
    head_sha = ((pr.get("head") or {}).get("sha")) or ""
    title = pr.get("title") or ""
    body = pr.get("body") or ""

    match = BRANCH_RE.match(head)
    sid = match.group(1) if match else None

    if not number:
        blockers.append("PR number missing")
    if state != "OPEN" or merged:
        blockers.append("PR is not open")
    if draft:
        blockers.append("PR is still draft")
    if base != "main":
        blockers.append(f"PR base must be main, got {base!r}")
    if not sid:
        blockers.append(f"PR head is not canonical agent/<subgoal-id>: {head!r}")
    elif sid not in title and sid not in body:
        blockers.append(f"PR does not identify claimed subgoal {sid}")

    if expected_head_sha and head_sha != expected_head_sha:
        blockers.append(
            f"head SHA moved: expected {expected_head_sha}, current {head_sha}"
        )

    mergeable = pr.get("mergeable")
    mergeable_state = pr.get("mergeable_state")
    if mergeable is False or mergeable_state == "dirty":
        blockers.append("PR has merge conflicts")
    if mergeable_state in {"blocked", "draft"}:
        blockers.append(f"GitHub mergeable_state is {mergeable_state}")

    issue_number = None
    close_match = ISSUE_RE.search(body)
    if not close_match:
        blockers.append("PR body is missing Closes/Fixes/Resolves #<issue>")
    else:
        issue_number = int(close_match.group(1))
        if not issue:
            blockers.append(f"linked issue #{issue_number} could not be resolved")
        else:
            if issue.get("pull_request"):
                blockers.append(f"#{issue_number} is a PR, not a roadmap issue")
            if str(issue.get("state") or "").lower() != "open":
                blockers.append(f"linked issue #{issue_number} is not open")
            if sid and not (issue.get("title") or "").startswith(f"[{sid}]"):
                blockers.append(f"linked issue #{issue_number} does not own {sid}")

    status_by_context = latest_status_by_context(statuses)
    readiness = status_by_context.get(READINESS_CONTEXT)
    if not readiness:
        blockers.append("Manager Review Readiness status is missing for current head")
    elif readiness.get("state") != "success":
        blockers.append(
            f"Manager Review Readiness is {readiness.get('state') or 'unknown'}"
        )

    latest_runs = latest_by_name(workflow_runs)
    for name in REQUIRED_WORKFLOWS:
        item = latest_runs.get(name)
        if not item:
            blockers.append(f"{name} run is missing for current head")
            continue
        if item.get("status") != "completed":
            blockers.append(f"{name} is {item.get('status')}")
        elif item.get("conclusion") != "success":
            blockers.append(f"{name} concluded {item.get('conclusion')}")

    return {
        "pr_number": number,
        "subgoal_id": sid,
        "issue_number": issue_number,
        "head_branch": head,
        "head_sha": head_sha,
        "base_branch": base,
        "mergeable_state": mergeable_state,
        "ready": not blockers,
        "blockers": blockers,
    }


def self_test():
    pr = {
        "number": 42,
        "state": "open",
        "merged": False,
        "draft": False,
        "title": "[TZ-ROADMAP-31-SG-01] Finish convergence",
        "body": "TZ-ROADMAP-31-SG-01\n\nCloses #99",
        "base": {"ref": "main"},
        "head": {
            "ref": "agent/TZ-ROADMAP-31-SG-01",
            "sha": "abc1234",
        },
        "mergeable": True,
        "mergeable_state": "clean",
    }
    issue = {
        "number": 99,
        "state": "open",
        "title": "[TZ-ROADMAP-31-SG-01] Finish convergence",
    }
    statuses = [
        {"context": READINESS_CONTEXT, "state": "success"},
    ]
    runs = [
        {
            "name": "Titan Zero CI",
            "status": "completed",
            "conclusion": "success",
            "created_at": "2026-01-01T00:00:00Z",
        },
        {
            "name": "Agent Claim Gate",
            "status": "completed",
            "conclusion": "success",
            "created_at": "2026-01-01T00:00:01Z",
        },
    ]
    result = evaluate(
        pr=pr,
        issue=issue,
        statuses=statuses,
        workflow_runs=runs,
        expected_head_sha="abc1234",
    )
    assert result["ready"] is True
    assert result["blockers"] == []

    moved = evaluate(
        pr=pr,
        issue=issue,
        statuses=statuses,
        workflow_runs=runs,
        expected_head_sha="deadbeef",
    )
    assert moved["ready"] is False
    assert any("head SHA moved" in b for b in moved["blockers"])

    draft_pr = dict(pr)
    draft_pr["draft"] = True
    blocked = evaluate(
        pr=draft_pr,
        issue=issue,
        statuses=statuses,
        workflow_runs=runs,
    )
    assert blocked["ready"] is False
    assert "PR is still draft" in blocked["blockers"]
    print("manager-merge self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pr", type=int, required=False)
    parser.add_argument(
        "--expected-head-sha",
        help="Required for --apply unless --allow-current-head is explicitly used",
    )
    parser.add_argument(
        "--allow-current-head",
        action="store_true",
        help="Use the currently observed head SHA instead of requiring the caller to pin it",
    )
    parser.add_argument(
        "--merge-method",
        choices=["merge", "squash", "rebase"],
        default="squash",
    )
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if not args.pr:
        raise SystemExit("--pr is required")

    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        repo = run([
            "gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"
        ]).stdout.strip()

    pr = run_json(["gh", "api", f"repos/{repo}/pulls/{args.pr}"])

    body = pr.get("body") or ""
    close_match = ISSUE_RE.search(body)
    issue = None
    if close_match:
        issue = run_json([
            "gh", "api", f"repos/{repo}/issues/{int(close_match.group(1))}"
        ])

    head_sha = ((pr.get("head") or {}).get("sha")) or ""
    statuses = run_json([
        "gh", "api", f"repos/{repo}/commits/{head_sha}/statuses"
    ]) or []
    runs_data = run_json([
        "gh", "api",
        f"repos/{repo}/actions/runs?head_sha={head_sha}&per_page=100"
    ]) or {}

    expected = args.expected_head_sha
    if args.apply and not expected and not args.allow_current_head:
        raise SystemExit(
            "--apply requires --expected-head-sha to prevent stale-review merges "
            "(or explicitly pass --allow-current-head)"
        )

    result = evaluate(
        pr=pr,
        issue=issue,
        statuses=statuses,
        workflow_runs=runs_data.get("workflow_runs") or [],
        expected_head_sha=expected,
    )

    if not result["ready"]:
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"BLOCKED PR #{args.pr}")
            for blocker in result["blockers"]:
                print(f"- {blocker}")
        return 1

    if not args.apply:
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(
                f"READY TO MERGE PR #{args.pr} {result['subgoal_id']} "
                f"head={result['head_sha']}"
            )
            print(
                "Dry-run only. Re-run with --apply --expected-head-sha "
                f"{result['head_sha']} after Manager review."
            )
        return 0

    merge_args = [
        "gh", "api", "--method", "PUT",
        f"repos/{repo}/pulls/{args.pr}/merge",
        "-f", f"merge_method={args.merge_method}",
        "-f", f"sha={result['head_sha']}",
    ]
    merged = run_json(merge_args)
    if not merged.get("merged"):
        raise SystemExit(
            "GitHub refused merge: " + str(merged.get("message") or merged)
        )

    payload = {
        **result,
        "merged": True,
        "merge_method": args.merge_method,
        "merge_sha": merged.get("sha"),
        "message": merged.get("message"),
    }
    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(
            f"MERGED PR #{args.pr} {result['subgoal_id']} "
            f"via {args.merge_method} -> {merged.get('sha')}"
        )
        print(
            "Post-merge roadmap finalization and safe claim cleanup now own the "
            "remaining lifecycle."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
