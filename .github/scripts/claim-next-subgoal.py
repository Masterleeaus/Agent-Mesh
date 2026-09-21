#!/usr/bin/env python3
"""Atomically claim the next eligible Titan Zero roadmap subgoal.

The Git branch ref is the mutex:
  agent/<subgoal-id>

Concurrent agents may safely run this script. They can race on the same first
candidate, but only one branch creation can succeed; losing agents continue to
the next eligible subgoal.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ROOT / "roadmap" / "SUBGOAL-ISSUE-MANIFEST.json"
CLAIMABLE_STATUSES = {"TODO"}
SUBGOAL_RE = re.compile(r"^(TZ-(?:G00|ROADMAP-\d+)-SG-(\d+))$")
TITLE_RE = re.compile(r"^\[([A-Z0-9-]+-SG-\d+)\]")


class CommandError(RuntimeError):
    def __init__(self, args, returncode, stdout, stderr):
        self.args_list = args
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr
        super().__init__((stderr or stdout or "command failed").strip())


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise CommandError(args, proc.returncode, proc.stdout, proc.stderr)
    return proc


def run_json(args):
    proc = run(args)
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Expected JSON from {' '.join(args)}: {exc}") from exc


def goal_number(goal_id):
    if goal_id == "TZ-G00":
        return 0
    match = re.search(r"(\d+)$", goal_id or "")
    return int(match.group(1)) if match else 999999


def subgoal_number(subgoal_id):
    match = re.search(r"SG-(\d+)$", subgoal_id or "")
    return int(match.group(1)) if match else 999999


def candidate_sort_key(item):
    return (
        goal_number(item.get("goal_id")),
        subgoal_number(item.get("subgoal_id")),
        item.get("subgoal_id") or "",
    )


def load_manifest():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(manifest, list):
        raise RuntimeError("SUBGOAL-ISSUE-MANIFEST.json must be a JSON array")
    return manifest


def issue_id(title):
    match = TITLE_RE.match(title or "")
    return match.group(1) if match else None


def choose_candidates(manifest, open_issue_ids, claimed_ids, open_pr_ids, goal=None, order="asc"):
    candidates = []
    for item in manifest:
        sid = item.get("subgoal_id")
        gid = item.get("goal_id")
        status = str(item.get("status") or "").upper()
        if not sid or not SUBGOAL_RE.match(sid):
            continue
        if goal and gid != goal:
            continue
        if status not in CLAIMABLE_STATUSES:
            continue
        if sid not in open_issue_ids:
            continue
        if sid in claimed_ids or sid in open_pr_ids:
            continue
        candidates.append(item)

    candidates.sort(key=candidate_sort_key, reverse=(order == "desc"))
    return candidates


def self_test():
    manifest = [
        {"goal_id": "TZ-ROADMAP-02", "subgoal_id": "TZ-ROADMAP-02-SG-02", "status": "TODO"},
        {"goal_id": "TZ-ROADMAP-01", "subgoal_id": "TZ-ROADMAP-01-SG-09", "status": "TODO"},
        {"goal_id": "TZ-ROADMAP-01", "subgoal_id": "TZ-ROADMAP-01-SG-02", "status": "TODO"},
        {"goal_id": "TZ-ROADMAP-01", "subgoal_id": "TZ-ROADMAP-01-SG-01", "status": "COMPLETE"},
        {"goal_id": "TZ-ROADMAP-03", "subgoal_id": "TZ-ROADMAP-03-SG-01", "status": "IN_PROGRESS"},
    ]
    open_ids = {x["subgoal_id"] for x in manifest}
    asc = choose_candidates(
        manifest,
        open_ids,
        {"TZ-ROADMAP-01-SG-09"},
        set(),
        order="asc",
    )
    assert [x["subgoal_id"] for x in asc] == [
        "TZ-ROADMAP-01-SG-02",
        "TZ-ROADMAP-02-SG-02",
    ]
    desc = choose_candidates(manifest, open_ids, set(), set(), order="desc")
    assert [x["subgoal_id"] for x in desc][:2] == [
        "TZ-ROADMAP-02-SG-02",
        "TZ-ROADMAP-01-SG-09",
    ]
    scoped = choose_candidates(
        manifest,
        open_ids,
        set(),
        set(),
        goal="TZ-ROADMAP-01",
        order="asc",
    )
    assert [x["subgoal_id"] for x in scoped] == [
        "TZ-ROADMAP-01-SG-02",
        "TZ-ROADMAP-01-SG-09",
    ]
    print("claim-next-subgoal self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--actor", default=os.environ.get("AGENT_MESH_ACTOR"))
    parser.add_argument("--goal", help="Restrict selection to one goal ID")
    parser.add_argument("--order", choices=["asc", "desc"], default="asc")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        try:
            repo = run(["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).stdout.strip()
        except Exception as exc:
            raise SystemExit(f"GITHUB_REPOSITORY unavailable and repo discovery failed: {exc}")

    actor = (args.actor or "").strip()
    if not actor:
        raise SystemExit("--actor or AGENT_MESH_ACTOR is required")

    manifest = load_manifest()

    issues = run_json([
        "gh", "issue", "list",
        "--repo", repo,
        "--state", "open",
        "--limit", "1000",
        "--json", "number,title,url",
    ])
    issue_by_id = {}
    for issue in issues:
        sid = issue_id(issue.get("title"))
        if sid and sid not in issue_by_id:
            issue_by_id[sid] = issue

    prs = run_json([
        "gh", "pr", "list",
        "--repo", repo,
        "--state", "open",
        "--limit", "500",
        "--json", "number,title,body,headRefName,url",
    ])
    open_pr_ids = set()
    for pr in prs:
        head = pr.get("headRefName") or ""
        if head.startswith("agent/"):
            open_pr_ids.add(head[len("agent/"):])
        text = (pr.get("title") or "") + "\n" + (pr.get("body") or "")
        open_pr_ids.update(re.findall(r"TZ-(?:G00|ROADMAP-\d+)-SG-\d+", text))

    refs = run_json([
        "gh", "api", f"repos/{repo}/git/matching-refs/heads/agent/"
    ])
    claimed_ids = set()
    for ref in refs:
        name = ref.get("ref") or ""
        prefix = "refs/heads/agent/"
        if name.startswith(prefix):
            claimed_ids.add(name[len(prefix):])

    candidates = choose_candidates(
        manifest,
        set(issue_by_id),
        claimed_ids,
        open_pr_ids,
        goal=args.goal,
        order=args.order,
    )

    if args.dry_run:
        payload = {
            "repo": repo,
            "order": args.order,
            "goal": args.goal,
            "eligible_count": len(candidates),
            "next": [
                {
                    "subgoal_id": item["subgoal_id"],
                    "goal_id": item["goal_id"],
                    "title": item.get("title"),
                    "issue": issue_by_id[item["subgoal_id"]],
                }
                for item in candidates[:10]
            ],
        }
        if args.json:
            print(json.dumps(payload, indent=2))
        else:
            print(f"Eligible subgoals: {payload['eligible_count']}")
            for item in payload["next"]:
                print(f"{item['subgoal_id']} — #{item['issue']['number']} — {item['title']}")
        return 0

    main_sha = run([
        "gh", "api", f"repos/{repo}/git/ref/heads/main", "--jq", ".object.sha"
    ]).stdout.strip()
    if not main_sha:
        raise SystemExit("Unable to resolve canonical main SHA")

    for item in candidates:
        sid = item["subgoal_id"]
        issue = issue_by_id[sid]
        branch = f"agent/{sid}"

        create = run([
            "gh", "api",
            "--method", "POST",
            f"repos/{repo}/git/refs",
            "-f", f"ref=refs/heads/{branch}",
            "-f", f"sha={main_sha}",
        ], check=False)

        if create.returncode != 0:
            combined = (create.stderr or "") + "\n" + (create.stdout or "")
            if "Reference already exists" in combined or "422" in combined:
                # Another agent won the atomic race. Continue to the next candidate.
                continue
            raise CommandError(
                ["gh", "api", "POST", f"repos/{repo}/git/refs"],
                create.returncode,
                create.stdout,
                create.stderr,
            )

        comment = (
            "### Agent Mesh claim\n\n"
            f"- **Actor:** `{actor}`\n"
            f"- **Subgoal:** `{sid}`\n"
            f"- **Claim branch:** `{branch}`\n"
            f"- **Base main SHA:** `{main_sha}`\n"
            f"- **Selection order:** `{args.order}`\n\n"
            "Branch creation is the atomic claim lock. Other agents must choose another eligible issue."
        )
        run([
            "gh", "issue", "comment", str(issue["number"]),
            "--repo", repo,
            "--body", comment,
        ])

        payload = {
            "repo": repo,
            "actor": actor,
            "subgoal_id": sid,
            "goal_id": item["goal_id"],
            "title": item.get("title"),
            "issue_number": issue["number"],
            "issue_url": issue["url"],
            "branch": branch,
            "base_main_sha": main_sha,
            "order": args.order,
        }
        if args.json:
            print(json.dumps(payload, indent=2))
        else:
            print(
                f"CLAIMED {sid} on {branch} from {main_sha} "
                f"(issue #{issue['number']})"
            )
        return 0

    raise SystemExit("No eligible unclaimed roadmap subgoal was available")


if __name__ == "__main__":
    raise SystemExit(main())
