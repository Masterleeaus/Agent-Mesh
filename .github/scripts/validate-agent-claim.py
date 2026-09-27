#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "roadmap" / "SUBGOAL-ISSUE-MANIFEST.json"
GOALS_DIR = ROOT / "roadmap" / "goals"
SUBGOAL_RE = re.compile(r"^(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")


def fail(message: str) -> None:
    print(f"CLAIM-GATE ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_manifest():
    with MANIFEST.open(encoding="utf-8") as f:
        manifest = json.load(f)
    if not isinstance(manifest, list):
        fail("roadmap/SUBGOAL-ISSUE-MANIFEST.json must be a JSON array")
    return manifest


def validate_roadmap_integrity():
    manifest = load_manifest()
    seen = {}
    errors = []

    for item in manifest:
        sid = item.get("subgoal_id")
        gid = item.get("goal_id")
        if not isinstance(sid, str) or not SUBGOAL_RE.match(sid):
            errors.append(f"invalid subgoal_id in manifest: {sid!r}")
            continue
        if sid in seen:
            errors.append(f"duplicate manifest subgoal_id: {sid}")
        seen[sid] = item

        goal_path = GOALS_DIR / f"{gid}.json"
        if not goal_path.exists():
            errors.append(f"missing goal file for {sid}: {goal_path.relative_to(ROOT)}")
            continue

        try:
            goal = json.loads(goal_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"invalid JSON in {goal_path.relative_to(ROOT)}: {exc}")
            continue

        goal_ids = {
            sg.get("subgoal_id")
            for sg in goal.get("subgoals", [])
            if isinstance(sg, dict)
        }
        if sid not in goal_ids:
            goal_status = str(goal.get("status") or "").upper()
            item_status = str(item.get("status") or "").upper()
            historical_only = (
                goal_status == "SUPERSEDED"
                and item_status in {"SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}
            )
            if not historical_only:
                errors.append(
                    f"{sid} exists in issue manifest but not in {goal_path.relative_to(ROOT)}"
                )

    goal_file_ids = set()
    for path in GOALS_DIR.glob("*.json"):
        try:
            goal = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
            continue
        gid = goal.get("goal_id")
        if not gid:
            errors.append(f"goal file missing goal_id: {path.relative_to(ROOT)}")
            continue
        if gid in goal_file_ids:
            errors.append(f"duplicate goal_id across goal files: {gid}")
        goal_file_ids.add(gid)

    expected_goal_ids = {"TZ-G00"} | {f"TZ-ROADMAP-{i:02d}" for i in range(1, 55)}
    missing_goals = sorted(expected_goal_ids - goal_file_ids)
    extra_goals = sorted(goal_file_ids - expected_goal_ids)
    if missing_goals:
        errors.append(f"missing canonical goal files: {', '.join(missing_goals)}")
    if extra_goals:
        errors.append(f"unexpected goal files: {', '.join(extra_goals)}")

    if errors:
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        fail(f"roadmap integrity failed with {len(errors)} error(s)")

    print(
        f"Roadmap integrity OK: {len(goal_file_ids)} goals, "
        f"{len(seen)} manifest subgoals."
    )
    return seen


def run_json(args):
    proc = subprocess.run(args, text=True, capture_output=True)
    if proc.returncode != 0:
        fail((proc.stderr or proc.stdout or "command failed").strip())
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        fail(f"expected JSON from {' '.join(args)}: {exc}")


def missing_agent_pr_structure(body: str):
    required_sections = [
        "## Agent Mesh PR",
        "### Objective",
        "### Files changed",
        "### Verification",
        "### Architecture / authority check",
        "### Completion / remaining work",
        "### Evidence / risk / rollback",
    ]
    required_metadata = [
        "**Linked issue:**",
        "**Subgoal ID:**",
        "**Goal ID:**",
        "**Claim branch:**",
    ]
    missing = [section for section in required_sections if section not in body]
    missing += [field for field in required_metadata if field not in body]
    return missing


def validate_pull_request():
    manifest_by_id = validate_roadmap_integrity()

    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        fail("GITHUB_EVENT_PATH is unavailable")
    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    pr = event.get("pull_request") or {}

    head = pr.get("head", {}).get("ref") or os.environ.get("GITHUB_HEAD_REF", "")
    base = pr.get("base", {}).get("ref") or os.environ.get("GITHUB_BASE_REF", "")
    number = pr.get("number") or event.get("number")
    title = pr.get("title") or ""
    body = pr.get("body") or ""

    if base != "main":
        fail(f"agent implementation PR must target main, got {base!r}")

    match = BRANCH_RE.match(head)
    if not match:
        if head.startswith("agent/"):
            fail(
                "claim branch must be exactly agent/<subgoal-id>, for example "
                "agent/TZ-ROADMAP-31-SG-01"
            )
        print(
            f"Control/Manager PR branch {head!r}: roadmap integrity verified; "
            "agent claim checks are not applicable."
        )
        return
    sid = match.group(1)

    item = manifest_by_id.get(sid)
    if not item:
        fail(f"{sid} is not present in roadmap/SUBGOAL-ISSUE-MANIFEST.json")

    status = str(item.get("status") or "").upper()
    if status in {"COMPLETE", "SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}:
        fail(f"{sid} is not claimable because roadmap status is {status}")

    if sid not in title and sid not in body:
        fail(f"PR must name its claimed subgoal ID {sid}")

    missing_structure = missing_agent_pr_structure(body)
    if missing_structure:
        fail(
            "agent PR body is missing required Agent Mesh evidence structure: "
            + ", ".join(missing_structure)
        )

    issue_match = re.search(
        r"(?im)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b", body
    )
    if not issue_match:
        fail("PR body must link its roadmap issue with 'Closes #<issue-number>'")
    issue_number = int(issue_match.group(1))

    repo = os.environ.get("GITHUB_REPOSITORY")
    token = os.environ.get("GH_TOKEN")
    if not repo or not token:
        fail("GITHUB_REPOSITORY/GH_TOKEN unavailable")

    issue = run_json([
        "gh", "api", f"repos/{repo}/issues/{issue_number}"
    ])
    if issue.get("pull_request"):
        fail(f"#{issue_number} is a pull request, not a roadmap issue")
    if issue.get("state") != "open":
        fail(f"linked roadmap issue #{issue_number} is not open")
    issue_title = issue.get("title") or ""
    if not issue_title.startswith(f"[{sid}]"):
        fail(
            f"linked issue #{issue_number} does not own {sid}; "
            f"title is {issue_title!r}"
        )

    open_prs = run_json([
        "gh", "pr", "list",
        "--repo", repo,
        "--state", "open",
        "--limit", "500",
        "--json", "number,headRefName,title,body",
    ])
    collisions = []
    for other in open_prs:
        if other.get("number") == number:
            continue
        other_head = other.get("headRefName") or ""
        other_text = (other.get("title") or "") + "\n" + (other.get("body") or "")
        if other_head == head or sid in other_text:
            collisions.append(other.get("number"))
    if collisions:
        fail(f"{sid} is already represented by open PR(s): {collisions}")

    print(
        f"Claim gate OK: PR #{number} owns {sid} via {head}; "
        f"linked issue #{issue_number} verified."
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        validate_roadmap_integrity()
        valid_body = """## Agent Mesh PR
**Linked issue:** Closes #1
**Subgoal ID:** TZ-ROADMAP-01-SG-01
**Goal ID:** TZ-ROADMAP-01
**Claim branch:** agent/TZ-ROADMAP-01-SG-01
### Objective
x
### Files changed
x
### Verification
x
### Architecture / authority check
x
### Completion / remaining work
x
### Evidence / risk / rollback
x
"""
        assert missing_agent_pr_structure(valid_body) == []
        assert "### Verification" in missing_agent_pr_structure(
            valid_body.replace("### Verification", "### Checks")
        )
        print("Agent PR evidence-structure self-test OK")
        return
    validate_pull_request()


if __name__ == "__main__":
    main()
