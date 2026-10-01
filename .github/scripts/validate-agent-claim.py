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
SUBGOAL_RE = re.compile(r"^(TZ-[A-Z0-9]+(?:-[A-Z0-9]+)*)$")
BRANCH_RE = re.compile(r"^agent/(TZ-[A-Z0-9]+(?:-[A-Z0-9]+)*)$")
ISSUE_BRANCH_RE = re.compile(r"^agent/issue-(\\d+)$")
CANONICAL_GOAL_IDS = {"TZ-G00"} | {f"TZ-ROADMAP-{i:02d}" for i in range(1, 55)}


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
        if gid not in CANONICAL_GOAL_IDS:
            # Ignore stale/non-canonical manifest rows. Canonical roadmap authority is
            # the goal-file set below; historical Agent Mesh claims must not expand it.
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

    expected_goal_ids = CANONICAL_GOAL_IDS
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
        f"{len(seen)} canonical manifest subgoals."
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
        "## Titan Zero Agent / Codex PR",
        "### Outcome",
        "### Files changed",
        "### Verification",
        "### Architecture / authority",
        "### Completion evidence",
        "### Risk / compatibility / rollback",
    ]
    required_metadata = [
        "**Linked issue:**",
        "**Subgoal ID:**",
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

    issue_branch = ISSUE_BRANCH_RE.match(head)
    match = BRANCH_RE.match(head)
    if not match and not issue_branch:
        if head.startswith("agent/"):
            fail("claim branch must be exactly agent/issue-<issue-number> per AGENTS.md")
        print(f"Non-agent PR branch {head!r}: roadmap integrity verified; agent claim checks are not applicable.")
        return

    sid = match.group(1) if match else None
    issue_number = int(issue_branch.group(1)) if issue_branch else None
    item = manifest_by_id.get(sid) if sid else None

    if sid:
        if item:
            status = str(item.get("status") or "").upper()
            if status in {"COMPLETE", "SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}:
                fail(f"{sid} is not claimable because roadmap status is {status}")
        if sid not in title and sid not in body:
            fail(f"PR must name its claimed subgoal ID {sid}")
        missing_structure = missing_agent_pr_structure(body)
        if missing_structure:
            fail("agent PR body is missing required Codex evidence structure: " + ", ".join(missing_structure))
        issue_match = re.search(r"(?im)\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#(\\d+)\\b", body)
        if not issue_match:
            fail("Subgoal PR body must link its roadmap issue with 'Closes #<issue-number>'")
        issue_number = int(issue_match.group(1))
    else:
        if f"agent/issue-{issue_number}" not in body:
            fail(f"PR body must record canonical claim branch agent/issue-{issue_number}")
        if not all(section in body for section in ("## Outcome", "## Verification performed", "## Remaining")):
            fail("issue-claim PR must include Outcome, Verification performed, and Remaining sections")
        issue_match = re.search(r"(?im)\\b(?:refs|close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#(\\d+)\\b", body)
        if not issue_match or int(issue_match.group(1)) != issue_number:
            fail(f"PR body must link claimed mission #{issue_number} with Refs or Closes")

    repo = os.environ.get("GITHUB_REPOSITORY")
    token = os.environ.get("GH_TOKEN")
    if not repo or not token:
        fail("GITHUB_REPOSITORY/GH_TOKEN unavailable")

    claim_ref = run_json(["gh", "api", f"repos/{repo}/git/ref/heads/{head}"])
    claim_sha = ((claim_ref.get("object") or {}).get("sha") or "").lower()
    pr_head_sha = str(pr.get("head", {}).get("sha") or "").lower()
    if not re.fullmatch(r"[0-9a-f]{40}", claim_sha):
        fail(f"canonical claim branch {head} does not resolve to a valid Git commit")
    if pr_head_sha and claim_sha != pr_head_sha:
        fail(f"PR head SHA {pr_head_sha} does not match canonical claim branch {head} at {claim_sha}")
    main_ref = run_json(["gh", "api", f"repos/{repo}/git/ref/heads/main"])
    main_sha = str(((main_ref.get("object") or {}).get("sha")) or "").lower()
    if not re.fullmatch(r"[0-9a-f]{40}", main_sha):
        fail("main does not resolve to a valid Git commit")
    ancestry = subprocess.run(["gh", "api", f"repos/{repo}/compare/{main_sha}...{claim_sha}", "--jq", ".status"], check=False, text=True, capture_output=True)
    if ancestry.returncode != 0 or ancestry.stdout.strip() not in {"ahead", "identical"}:
        fail(f"canonical claim branch {head} is not based on current main ancestry: {ancestry.stdout.strip() or ancestry.stderr.strip()}")

    issue = run_json([
        "gh", "api", f"repos/{repo}/issues/{issue_number}"
    ])
    if issue.get("pull_request"):
        fail(f"#{issue_number} is a pull request, not a roadmap issue")
    if issue.get("state") != "open":
        fail(f"linked roadmap issue #{issue_number} is not open")
    issue_title = issue.get("title") or ""
    if sid and not issue_title.startswith(f"[{sid}]"):
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
        if other_head == head or (sid and sid in other_text) or f"#{issue_number}" in other_text:
            collisions.append(other.get("number"))
    if collisions:
        fail(f"{sid} is already represented by open PR(s): {collisions}")

    print(
        f"Claim gate OK: PR #{number} owns {sid} via {head}; "
        f"linked issue #{issue_number} verified."
    )



def self_test_pr_path(body):
    """Exercise the real PR path with only GitHub/process I/O replaced."""
    import tempfile
    from unittest.mock import patch
    sid = "TZ-SELF-TEST"
    sha = "a" * 40
    pr = {"number": 1, "title": f"[{sid}] Test", "body": body,
          "head": {"ref": f"agent/{sid}", "sha": sha}, "base": {"ref": "main"}}
    def response(args):
        if args[:3] == ["gh", "pr", "list"]:
            return []
        if "/git/ref/" in args[-1]:
            return {"object": {"sha": sha}}
        return {"state": "open", "title": f"[{sid}] Test"}
    with tempfile.TemporaryDirectory() as folder:
        event = Path(folder) / "event.json"
        event.write_text(json.dumps({"pull_request": pr}), encoding="utf-8")
        with patch.dict(os.environ, {"GITHUB_EVENT_PATH": str(event), "GITHUB_REPOSITORY": "fixture/repo", "GH_TOKEN": "fixture"}), \
             patch(__name__ + ".validate_roadmap_integrity", return_value={}), \
             patch(__name__ + ".run_json", side_effect=response), \
             patch("subprocess.run", return_value=subprocess.CompletedProcess([], 0, "ahead\n", "")) as ancestry:
            validate_pull_request()
            assert "/compare/" in ancestry.call_args.args[0][2]
            ancestry.return_value = subprocess.CompletedProcess([], 0, "diverged\n", "")
            try:
                validate_pull_request()
            except SystemExit as error:
                assert error.code == 1
            else:
                raise AssertionError("diverged claim unexpectedly passed")
    print("Claim PR ancestry-path self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        validate_roadmap_integrity()
        valid_body = """## Titan Zero Agent / Codex PR
**Linked issue:** Closes #1
**Subgoal ID:** TZ-ROADMAP-01-SG-01
**Goal ID:** TZ-ROADMAP-01
**Claim branch:** agent/TZ-ROADMAP-01-SG-01
### Outcome
x
### Files changed
x
### Verification
x
### Architecture / authority
x
### Completion evidence
x
### Risk / compatibility / rollback
x
"""
        assert missing_agent_pr_structure(valid_body) == []
        assert "### Verification" in missing_agent_pr_structure(
            valid_body.replace("### Verification", "### Checks")
        )
        print("Codex PR evidence-structure self-test OK")
        self_test_pr_path(valid_body)
        return
    validate_pull_request()


if __name__ == "__main__":
    main()
