#!/usr/bin/env python3
"""Finalize roadmap state after a Manager merges a canonical agent PR.

This script does not decide whether work is complete. A Manager merge of the
single canonical agent/<subgoal-id> PR is the completion decision. The script
only reconciles durable roadmap state to that already-established GitHub fact.
"""

import argparse
import json
import os
import re
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ROOT / "roadmap" / "SUBGOAL-ISSUE-MANIFEST.json"
GOALS_DIR = ROOT / "roadmap" / "goals"
BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
CLOSE_RE = re.compile(
    r"(?im)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b"
)
TERMINAL = {"COMPLETE", "SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}


def fail(message):
    print(f"FINALIZER ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def extract_context(event):
    pr = event.get("pull_request") or {}
    if not pr.get("merged"):
        fail("pull request event is not a merged PR")

    base = ((pr.get("base") or {}).get("ref")) or ""
    head = ((pr.get("head") or {}).get("ref")) or ""
    if base != "main":
        fail(f"merged PR base must be main, got {base!r}")

    match = BRANCH_RE.match(head)
    if not match:
        fail(f"merged PR head is not a canonical agent claim branch: {head!r}")
    sid = match.group(1)

    title = pr.get("title") or ""
    body = pr.get("body") or ""
    if sid not in title and sid not in body:
        fail(f"merged PR does not identify claimed subgoal {sid}")

    close = CLOSE_RE.search(body)
    if not close:
        fail("merged agent PR body must contain Closes/Fixes/Resolves #<issue>")
    issue_number = int(close.group(1))

    merge_sha = pr.get("merge_commit_sha") or ""
    merged_at = pr.get("merged_at") or ""
    pr_number = int(pr.get("number") or event.get("number") or 0)
    if not merge_sha or not merged_at or not pr_number:
        fail("merged PR event is missing merge SHA, merged_at or PR number")

    return {
        "subgoal_id": sid,
        "goal_id": sid.rsplit("-SG-", 1)[0],
        "issue_number": issue_number,
        "pr_number": pr_number,
        "merge_sha": merge_sha,
        "merged_at_utc": merged_at,
        "head_branch": head,
    }


def compute_progress(subgoals):
    total = len(subgoals)
    if total == 0:
        return 100
    complete = sum(
        1 for sg in subgoals
        if str(sg.get("status") or "").upper() in TERMINAL
    )
    return int(round((complete / total) * 100))


def apply_finalization(manifest, goal, context):
    sid = context["subgoal_id"]
    gid = context["goal_id"]

    manifest_matches = [item for item in manifest if item.get("subgoal_id") == sid]
    if len(manifest_matches) != 1:
        fail(f"expected exactly one manifest entry for {sid}, found {len(manifest_matches)}")
    manifest_item = manifest_matches[0]
    if manifest_item.get("goal_id") != gid:
        fail(
            f"manifest goal mismatch for {sid}: "
            f"{manifest_item.get('goal_id')!r} != {gid!r}"
        )

    if goal.get("goal_id") != gid:
        fail(f"goal file ID mismatch: {goal.get('goal_id')!r} != {gid!r}")

    matches = [sg for sg in goal.get("subgoals", []) if sg.get("subgoal_id") == sid]
    if len(matches) != 1:
        fail(f"expected exactly one goal subgoal for {sid}, found {len(matches)}")
    subgoal = matches[0]

    receipt = {
        "source": "GITHUB_MANAGER_MERGE",
        "pr_number": context["pr_number"],
        "issue_number": context["issue_number"],
        "merge_sha": context["merge_sha"],
        "head_branch": context["head_branch"],
        "merged_at_utc": context["merged_at_utc"],
    }

    # Idempotency: the same merge may be delivered more than once.
    existing_receipt = subgoal.get("completion_receipt") or {}
    if (
        str(subgoal.get("status") or "").upper() == "COMPLETE"
        and existing_receipt.get("merge_sha") == context["merge_sha"]
        and manifest_item.get("status") == "COMPLETE"
    ):
        return False

    previous_status = str(subgoal.get("status") or "")
    if previous_status.upper() in {"SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}:
        fail(f"cannot finalize superseded subgoal {sid}")

    subgoal["status"] = "COMPLETE"
    subgoal["claimable"] = False
    subgoal["completion_receipt"] = receipt

    execution = subgoal.get("execution")
    if isinstance(execution, dict):
        execution["state"] = "COMPLETE"
        execution["completed_at"] = context["merged_at_utc"]
        execution["merged_pr_number"] = context["pr_number"]
        execution["merge_sha"] = context["merge_sha"]
        execution["claim_branch"] = context["head_branch"]
        execution["claimed_by"] = None
        execution["current_pass_id"] = None

    manifest_item["status"] = "COMPLETE"

    goal["progress_percent"] = compute_progress(goal.get("subgoals", []))
    statuses = {
        str(sg.get("status") or "").upper()
        for sg in goal.get("subgoals", [])
    }
    if statuses and statuses.issubset(TERMINAL):
        if str(goal.get("status") or "").upper() != "SUPERSEDED":
            goal["status"] = "COMPLETE"

    return True


def self_test():
    event = {
        "number": 99,
        "pull_request": {
            "number": 99,
            "merged": True,
            "merged_at": "2026-09-21T09:00:00Z",
            "merge_commit_sha": "abc1234def5678",
            "title": "[TZ-ROADMAP-19-SG-03] Standardise structured logs",
            "body": "Closes #313\n\nTZ-ROADMAP-19-SG-03",
            "head": {"ref": "agent/TZ-ROADMAP-19-SG-03"},
            "base": {"ref": "main"},
        },
    }
    context = extract_context(event)
    assert context["subgoal_id"] == "TZ-ROADMAP-19-SG-03"
    assert context["issue_number"] == 313

    manifest = [{
        "subgoal_id": "TZ-ROADMAP-19-SG-03",
        "goal_id": "TZ-ROADMAP-19",
        "status": "TODO",
    }]
    goal = {
        "goal_id": "TZ-ROADMAP-19",
        "status": "PLANNED",
        "progress_percent": 0,
        "subgoals": [
            {
                "subgoal_id": "TZ-ROADMAP-19-SG-03",
                "status": "TODO",
                "claimable": True,
                "execution": {
                    "state": "CLAIMED",
                    "claimed_by": "builder-1",
                    "current_pass_id": "p1",
                },
            },
            {
                "subgoal_id": "TZ-ROADMAP-19-SG-04",
                "status": "COMPLETE",
                "claimable": False,
            },
        ],
    }
    changed = apply_finalization(manifest, goal, context)
    assert changed is True
    sg = goal["subgoals"][0]
    assert sg["status"] == "COMPLETE"
    assert sg["claimable"] is False
    assert sg["execution"]["state"] == "COMPLETE"
    assert sg["completion_receipt"]["pr_number"] == 99
    assert manifest[0]["status"] == "COMPLETE"
    assert goal["progress_percent"] == 100
    assert goal["status"] == "COMPLETE"

    changed_again = apply_finalization(manifest, goal, context)
    assert changed_again is False
    print("finalize-merged-subgoal self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--event", help="GitHub pull_request event JSON path")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    event_path = args.event or os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        fail("--event or GITHUB_EVENT_PATH is required")

    event = read_json(Path(event_path))
    context = extract_context(event)

    manifest = read_json(MANIFEST_PATH)
    goal_path = GOALS_DIR / f"{context['goal_id']}.json"
    if not goal_path.exists():
        fail(f"missing canonical goal file: {goal_path.relative_to(ROOT)}")
    goal = read_json(goal_path)

    changed = apply_finalization(manifest, goal, context)

    if changed:
        write_json(MANIFEST_PATH, manifest)
        write_json(goal_path, goal)

    payload = {
        **context,
        "changed": changed,
        "manifest_path": str(MANIFEST_PATH.relative_to(ROOT)),
        "goal_path": str(goal_path.relative_to(ROOT)),
        "progress_percent": goal.get("progress_percent"),
        "goal_status": goal.get("status"),
    }

    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with Path(output).open("a", encoding="utf-8") as f:
            for key in ("subgoal_id", "goal_id", "issue_number", "pr_number", "merge_sha"):
                f.write(f"{key}={payload[key]}\n")
            f.write(f"changed={'true' if changed else 'false'}\n")

    print(json.dumps(payload, indent=2) if args.json else (
        f"FINALIZED {context['subgoal_id']} from PR #{context['pr_number']} "
        f"merge {context['merge_sha']} changed={changed}"
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
