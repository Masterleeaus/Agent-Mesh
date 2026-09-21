#!/usr/bin/env python3
"""Create or update the canonical PR for the current Agent Mesh claim branch."""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
ISSUE_TITLE_RE = re.compile(r"^\[([A-Z0-9-]+-SG-\d+)\]")
CLAIM_BASE_RE = re.compile(r"(?:Base main SHA|base)[:=][^0-9a-f]*([0-9a-f]{7,40})", re.I)


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def parse_branch(branch):
    match = BRANCH_RE.match(branch or "")
    return match.group(1) if match else None


def select_canonical_issue(matching):
    if not matching:
        return None
    open_issues = [
        item for item in matching
        if str(item.get("state") or "").upper() == "OPEN"
    ]
    pool = open_issues or matching
    pool.sort(key=lambda item: int(item["number"]))
    return pool[0]


def render_body(*, sid, gid, issue_number, branch, claim_base, merge_base,
                objective, changed_files, verification, completion, risk):
    files = "\n".join(f"- {name}" for name in changed_files) or "- No changed files detected"
    checks = "\n".join(f"- {line}" for line in verification) or "- CI / targeted verification not yet recorded"
    completion_text = completion.strip() or "State the verified completion basis or only the remaining work."
    risk_text = risk.strip() or "No additional migration, compatibility, rollback, security, privacy or cost impact recorded."
    return f"""## Agent Mesh PR

**Linked issue:** Closes #{issue_number}
**Subgoal ID:** {sid}
**Goal ID:** {gid}
**Claim branch:** {branch}
**Claim base main SHA:** {claim_base or 'unknown'}
**Current merge-base SHA:** {merge_base or 'unknown'}

### Objective

{objective.strip()}

### Files changed

{files}

### Verification

{checks}

Results:

- [ ] Agent Claim Gate passes
- [ ] Titan Zero CI passes or inherited baseline debt remains non-regressed
- [ ] Targeted checks appropriate to this subgoal pass
- [ ] No unexplained regression introduced

### Architecture / authority check

- [ ] company_id remains the canonical company boundary
- [ ] No duplicate surface/adapter business logic introduced
- [ ] Command Bus/governed authority boundaries preserved where applicable
- [ ] Device/privacy/Cost Sovereignty behavior preserved
- [ ] No Titan Code production runtime dependency introduced
- [ ] Existing capability/workforce contracts reused before adding parallel definitions

### Completion / remaining work

{completion_text}

### Evidence / risk / rollback

{risk_text}
"""


def self_test():
    assert parse_branch("agent/TZ-ROADMAP-31-SG-01") == "TZ-ROADMAP-31-SG-01"
    assert parse_branch("agent/TZ-G00-SG-01") == "TZ-G00-SG-01"
    assert parse_branch("agent/TZ-ROADMAP-31-SG-01-worker") is None
    chosen = select_canonical_issue([
        {"number": 70, "state": "CLOSED"},
        {"number": 71, "state": "OPEN"},
        {"number": 72, "state": "OPEN"},
    ])
    assert chosen["number"] == 71
    body = render_body(
        sid="TZ-ROADMAP-31-SG-01",
        gid="TZ-ROADMAP-31",
        issue_number=42,
        branch="agent/TZ-ROADMAP-31-SG-01",
        claim_base="abcdef0",
        merge_base="abcdef1",
        objective="Finish the remaining convergence work.",
        changed_files=["a.ts", "b.ts"],
        verification=["pnpm test — pass"],
        completion="Completed.",
        risk="Rollback by reverting this PR.",
    )
    assert "Closes #42" in body
    assert "agent/TZ-ROADMAP-31-SG-01" in body
    assert "a.ts" in body and "pnpm test — pass" in body
    print("open-agent-pr self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", help="Claim branch; defaults to current git branch")
    parser.add_argument("--objective", default="")
    parser.add_argument("--verification", action="append", default=[])
    parser.add_argument("--completion", default="")
    parser.add_argument("--risk", default="")
    parser.add_argument("--draft", action="store_true")
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Refresh an existing PR body/title instead of preserving builder evidence",
    )
    parser.add_argument("--dry-run", action="store_true")
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

    branch = (args.branch or "").strip()
    if not branch:
        branch = run(["git", "branch", "--show-current"]).stdout.strip()

    sid = parse_branch(branch)
    if not sid:
        raise SystemExit(
            "Current/selected branch must be exactly agent/<subgoal-id>; "
            f"got {branch!r}"
        )

    issues = run_json([
        "gh", "issue", "list",
        "--repo", repo,
        "--state", "all",
        "--limit", "1000",
        "--json", "number,title,state,url,body",
    ]) or []

    matching = []
    for issue in issues:
        match = ISSUE_TITLE_RE.match(issue.get("title") or "")
        if match and match.group(1) == sid:
            matching.append(issue)
    if not matching:
        raise SystemExit(f"No roadmap issue found for {sid}")

    issue = select_canonical_issue(matching)
    if str(issue.get("state") or "").upper() != "OPEN":
        raise SystemExit(f"Roadmap issue #{issue['number']} for {sid} is not open")

    gid = sid.rsplit("-SG-", 1)[0]
    compare = run_json(["gh", "api", f"repos/{repo}/compare/main...{branch}"])
    ahead_by = int(compare.get("ahead_by") or 0)
    behind_by = int(compare.get("behind_by") or 0)
    merge_base = ((compare.get("merge_base_commit") or {}).get("sha") or "")
    if ahead_by <= 0:
        raise SystemExit(f"{branch} has no commits ahead of main; refusing to create an empty PR")

    changed_files = sorted({
        item.get("filename")
        for item in (compare.get("files") or [])
        if item.get("filename")
    })

    comments = run_json([
        "gh", "api", "--paginate",
        f"repos/{repo}/issues/{issue['number']}/comments"
    ]) or []
    claim_base = ""
    for comment in reversed(comments):
        body = comment.get("body") or ""
        if sid not in body:
            continue
        match = CLAIM_BASE_RE.search(body)
        if match:
            claim_base = match.group(1)
            break

    commits = compare.get("commits") or []
    commit_subjects = []
    for commit in commits:
        message = (((commit.get("commit") or {}).get("message")) or "").splitlines()[0].strip()
        if message:
            commit_subjects.append(message)

    objective = args.objective.strip()
    if not objective:
        issue_title = issue.get("title") or sid
        objective = (
            f"Complete the remaining verified work for {issue_title}.\n\n"
            "Commits in this handoff:\n"
            + "\n".join(f"- {subject}" for subject in commit_subjects)
        )

    verification = list(args.verification)
    if not verification:
        verification = [
            "Canonical Agent Claim Gate / Titan Zero CI will run on this PR.",
            "Builder must add targeted verification evidence before Manager merge if CI alone does not cover the change.",
        ]

    body = render_body(
        sid=sid,
        gid=gid,
        issue_number=issue["number"],
        branch=branch,
        claim_base=claim_base,
        merge_base=merge_base,
        objective=objective,
        changed_files=changed_files,
        verification=verification,
        completion=args.completion,
        risk=args.risk,
    )

    title_suffix = re.sub(r"^\[[^]]+\]\s*", "", issue.get("title") or sid).strip()
    title = f"[{sid}] {title_suffix}"

    existing_prs = run_json([
        "gh", "pr", "list",
        "--repo", repo,
        "--state", "open",
        "--head", branch,
        "--json", "number,url,title,headRefName",
    ]) or []

    payload = {
        "repo": repo,
        "subgoal_id": sid,
        "goal_id": gid,
        "issue_number": issue["number"],
        "branch": branch,
        "ahead_by": ahead_by,
        "behind_by": behind_by,
        "claim_base_main_sha": claim_base or None,
        "merge_base_sha": merge_base or None,
        "changed_files": changed_files,
        "existing_pr": existing_prs[0] if existing_prs else None,
        "title": title,
        "body": body,
    }

    if args.dry_run:
        print(json.dumps(payload, indent=2) if args.json else body)
        return 0

    if existing_prs:
        pr = existing_prs[0]
        number = pr["number"]
        url = pr["url"]
        if args.update_existing:
            run([
                "gh", "pr", "edit", str(number),
                "--repo", repo,
                "--title", title,
                "--body", body,
            ])
            action = "updated"
        else:
            action = "existing-preserved"
    else:
        cmd = [
            "gh", "pr", "create",
            "--repo", repo,
            "--base", "main",
            "--head", branch,
            "--title", title,
            "--body", body,
        ]
        if args.draft:
            cmd.append("--draft")
        proc = run(cmd)
        url = proc.stdout.strip()
        created = run_json([
            "gh", "pr", "view", url,
            "--repo", repo,
            "--json", "number,url",
        ])
        number = created["number"]
        url = created["url"]
        action = "created"
        run([
            "gh", "issue", "comment", str(issue["number"]),
            "--repo", repo,
            "--body",
            (
                "### Agent Mesh PR handoff\n\n"
                f"- **Subgoal:** {sid}\n"
                f"- **PR:** #{number} — {url}\n"
                f"- **Claim branch:** {branch}\n"
                f"- **Commits ahead of main:** {ahead_by}\n\n"
                "Manager review and CI now own the integration decision."
            ),
        ])

    result = {
        **{k: v for k, v in payload.items() if k != "body"},
        "action": action,
        "pr_number": number,
        "pr_url": url,
    }
    print(json.dumps(result, indent=2) if args.json else f"{action.upper()} PR #{number}: {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
