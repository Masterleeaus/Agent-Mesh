#!/usr/bin/env python3
"""Record a durable pending-PR handoff when Actions cannot create the PR."""

import argparse
import json
import os
import re
import subprocess

BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
TITLE_RE = re.compile(r"^\[([A-Z0-9-]+-SG-\d+)\]")


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def marker_for(sid):
    return f"<!-- agent-pr-handoff-pending:{sid} -->"


def self_test():
    marker = marker_for("TZ-ROADMAP-01-SG-01")
    assert marker == "<!-- agent-pr-handoff-pending:TZ-ROADMAP-01-SG-01 -->"
    assert "TZ-ROADMAP-01-SG-01" in marker
    print("record-pr-handoff-pending self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", required=True)
    parser.add_argument("--reason", required=True)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    match = BRANCH_RE.match(args.branch)
    if not match:
        raise SystemExit(f"Not a canonical agent claim branch: {args.branch!r}")
    sid = match.group(1)

    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        repo = run([
            "gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"
        ]).stdout.strip()

    issues = run_json([
        "gh", "issue", "list",
        "--repo", repo,
        "--state", "open",
        "--limit", "1000",
        "--json", "number,title,url",
    ]) or []
    issue = None
    for item in sorted(issues, key=lambda x: int(x["number"])):
        m = TITLE_RE.match(item.get("title") or "")
        if m and m.group(1) == sid:
            issue = item
            break
    if not issue:
        raise SystemExit(f"No open roadmap issue found for {sid}")

    compare = run_json(["gh", "api", f"repos/{repo}/compare/main...{args.branch}"])
    ahead_by = int(compare.get("ahead_by") or 0)
    behind_by = int(compare.get("behind_by") or 0)
    if ahead_by <= 0:
        raise SystemExit(f"{args.branch} has no commits ahead of main")

    commits = compare.get("commits") or []
    head_sha = commits[-1].get("sha") if commits else ""
    merge_base = ((compare.get("merge_base_commit") or {}).get("sha") or "")
    changed_files = sorted({
        item.get("filename")
        for item in (compare.get("files") or [])
        if item.get("filename")
    })

    marker = marker_for(sid)
    files = "\n".join(f"- `{name}`" for name in changed_files[:100])
    if len(changed_files) > 100:
        files += f"\n- … plus {len(changed_files) - 100} more file(s)"

    body = f"""{marker}
### Agent PR handoff pending

The claim branch contains committed work, but the GitHub Actions token could not create the pull request.

- **Subgoal:** `{sid}`
- **Claim branch:** `{args.branch}`
- **Head SHA:** `{head_sha}`
- **Merge-base SHA:** `{merge_base}`
- **Ahead / behind main:** {ahead_by} / {behind_by}
- **Reason:** {args.reason}

Changed files:

{files or "- No changed files reported"}

The claim remains active. Create the canonical PR from this same branch using an authenticated Agent/Manager context with pull-request creation rights, or enable GitHub Actions to create pull requests for this repository. Do not create an alternate claim branch.
"""

    comments = run_json([
        "gh", "api", "--paginate",
        f"repos/{repo}/issues/{issue['number']}/comments"
    ]) or []
    existing = next(
        (comment for comment in comments if marker in (comment.get("body") or "")),
        None,
    )

    if existing:
        run([
            "gh", "api", "--method", "PATCH",
            f"repos/{repo}/issues/comments/{existing['id']}",
            "-f", f"body={body}",
        ])
        action = "updated"
        comment_id = existing["id"]
    else:
        created = run_json([
            "gh", "api", "--method", "POST",
            f"repos/{repo}/issues/{issue['number']}/comments",
            "-f", f"body={body}",
        ])
        action = "created"
        comment_id = created.get("id")

    print(json.dumps({
        "action": action,
        "subgoal_id": sid,
        "issue_number": issue["number"],
        "branch": args.branch,
        "head_sha": head_sha,
        "ahead_by": ahead_by,
        "behind_by": behind_by,
        "comment_id": comment_id,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
