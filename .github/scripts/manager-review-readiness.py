#!/usr/bin/env python3
"""Evaluate Agent Mesh PRs for Manager-review readiness.

This script never merges, closes, or edits implementation content. It can publish
one commit status on each agent PR head:
  Agent Mesh / Manager Review Readiness
"""

import argparse
import json
import os
import re
import subprocess
import sys

BRANCH_RE = re.compile(r"^agent/(TZ-(?:G00|ROADMAP-\d+)-SG-\d+)$")
ISSUE_RE = re.compile(r"(?im)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b")
REQUIRED_WORKFLOWS = ("Titan Zero CI", "Agent Claim Gate")
STATUS_CONTEXT = "Agent Mesh / Manager Review Readiness"

SECTION_NAMES = (
    "Objective",
    "Files changed",
    "Verification",
    "Completion / remaining work",
    "Evidence / risk / rollback",
)

PLACEHOLDER_MARKERS = (
    "State the verified completion basis or only the remaining work.",
    "No additional migration, compatibility, rollback, security, privacy or cost impact recorded.",
    "Builder must add targeted verification evidence before Manager merge if CI alone does not cover the change.",
)


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def section(body, name):
    pattern = re.compile(
        rf"(?ims)^###\s+{re.escape(name)}\s*$\n(.*?)(?=^###\s+|\Z)"
    )
    match = pattern.search(body or "")
    return match.group(1).strip() if match else ""


def evidence_blockers(body):
    blockers = []
    for name in SECTION_NAMES:
        value = section(body, name)
        if not value:
            blockers.append(f"missing/non-populated section: {name}")

    completion = section(body, "Completion / remaining work")
    risk = section(body, "Evidence / risk / rollback")
    verification = section(body, "Verification")

    for marker in PLACEHOLDER_MARKERS:
        if marker in completion or marker in risk or marker in verification:
            blockers.append(f"placeholder evidence remains: {marker}")

    custom_verification = [
        line.strip()
        for line in verification.splitlines()
        if line.strip().startswith("-")
        and "Canonical Agent Claim Gate / Titan Zero CI will run on this PR." not in line
        and "Builder must add targeted verification evidence" not in line
    ]
    if not custom_verification:
        blockers.append("no targeted verification evidence recorded")

    files = section(body, "Files changed")
    if "No changed files detected" in files:
        blockers.append("PR handoff reports no changed files")

    return blockers


def evaluate_workflows(runs):
    latest = {}
    for item in sorted(runs, key=lambda x: x.get("created_at") or "", reverse=True):
        name = item.get("name")
        if name in REQUIRED_WORKFLOWS and name not in latest:
            latest[name] = item

    blockers = []
    waiting = []
    for name in REQUIRED_WORKFLOWS:
        run_item = latest.get(name)
        if not run_item:
            waiting.append(f"{name}: no run for current head")
            continue
        status = run_item.get("status")
        conclusion = run_item.get("conclusion")
        if status != "completed":
            waiting.append(f"{name}: {status}")
        elif conclusion != "success":
            blockers.append(f"{name}: {conclusion or 'no conclusion'}")
    return blockers, waiting


def classify(*, structural_blockers, workflow_blockers, waiting, draft):
    blockers = list(structural_blockers) + list(workflow_blockers)
    if blockers:
        return "BLOCKED", blockers
    if draft:
        return "WAITING", ["PR is still draft"]
    if waiting:
        return "WAITING", list(waiting)
    return "READY", []


def self_test():
    body = """## Agent Mesh PR

### Objective
Implemented the remaining contract convergence.

### Files changed
- packages/a.ts

### Verification
- pnpm --filter a test — pass

### Completion / remaining work
All acceptance criteria for this pass are verified complete.

### Evidence / risk / rollback
No schema migration. Revert the PR to roll back.
"""
    assert evidence_blockers(body) == []
    assert evidence_blockers(body.replace(
        "All acceptance criteria for this pass are verified complete.",
        "State the verified completion basis or only the remaining work."
    ))
    wf_block, wf_wait = evaluate_workflows([
        {"name": "Titan Zero CI", "status": "completed", "conclusion": "success", "created_at": "2026-01-01T00:00:00Z"},
        {"name": "Agent Claim Gate", "status": "completed", "conclusion": "success", "created_at": "2026-01-01T00:00:01Z"},
    ])
    assert not wf_block and not wf_wait
    state, reasons = classify(
        structural_blockers=[], workflow_blockers=[], waiting=[], draft=False
    )
    assert state == "READY" and reasons == []
    state, _ = classify(
        structural_blockers=[], workflow_blockers=[], waiting=["CI pending"], draft=False
    )
    assert state == "WAITING"
    state, _ = classify(
        structural_blockers=["issue mismatch"], workflow_blockers=[], waiting=[], draft=False
    )
    assert state == "BLOCKED"
    print("manager-review-readiness self-test OK")


def publish_status(repo, sha, state, description, target_url=None):
    gh_state = {"READY": "success", "WAITING": "pending", "BLOCKED": "failure"}[state]
    args = [
        "gh", "api", "--method", "POST",
        f"repos/{repo}/statuses/{sha}",
        "-f", f"state={gh_state}",
        "-f", f"context={STATUS_CONTEXT}",
        "-f", f"description={description[:140]}",
    ]
    if target_url:
        args.extend(["-f", f"target_url={target_url}"])
    run(args)


def evaluate_pr(repo, pr):
    number = int(pr["number"])
    head = pr.get("headRefName") or ""
    head_sha = pr.get("headRefOid") or ""
    body = pr.get("body") or ""
    title = pr.get("title") or ""
    draft = bool(pr.get("isDraft"))

    match = BRANCH_RE.match(head)
    if not match:
        return None
    sid = match.group(1)

    structural = []
    if sid not in title and sid not in body:
        structural.append(f"PR does not identify claimed subgoal {sid}")

    issue_match = ISSUE_RE.search(body)
    issue = None
    if not issue_match:
        structural.append("missing Closes #<issue> link")
    else:
        issue_number = int(issue_match.group(1))
        issue = run_json(["gh", "api", f"repos/{repo}/issues/{issue_number}"])
        if issue.get("pull_request"):
            structural.append(f"#{issue_number} is a PR, not a roadmap issue")
        if issue.get("state") != "open":
            structural.append(f"linked issue #{issue_number} is not open")
        if not (issue.get("title") or "").startswith(f"[{sid}]"):
            structural.append(f"linked issue #{issue_number} does not own {sid}")

    structural.extend(evidence_blockers(body))

    detail = run_json(["gh", "api", f"repos/{repo}/pulls/{number}"])
    mergeable_state = detail.get("mergeable_state")
    if mergeable_state == "dirty":
        structural.append("PR has merge conflicts")

    runs_data = run_json([
        "gh", "api",
        f"repos/{repo}/actions/runs?head_sha={head_sha}&per_page=100"
    ]) or {}
    workflow_blockers, waiting = evaluate_workflows(runs_data.get("workflow_runs") or [])

    state, reasons = classify(
        structural_blockers=structural,
        workflow_blockers=workflow_blockers,
        waiting=waiting,
        draft=draft,
    )

    return {
        "pr_number": number,
        "pr_url": pr.get("url"),
        "subgoal_id": sid,
        "head_branch": head,
        "head_sha": head_sha,
        "draft": draft,
        "mergeable_state": mergeable_state,
        "state": state,
        "reasons": reasons,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pr", type=int, help="Evaluate one PR number; default scans open agent PRs")
    parser.add_argument("--publish-status", action="store_true")
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

    if args.pr:
        prs = [run_json([
            "gh", "pr", "view", str(args.pr), "--repo", repo,
            "--json", "number,title,body,url,isDraft,headRefName,headRefOid"
        ])]
    else:
        prs = run_json([
            "gh", "pr", "list", "--repo", repo, "--state", "open", "--limit", "500",
            "--json", "number,title,body,url,isDraft,headRefName,headRefOid"
        ]) or []

    results = []
    for pr in prs:
        result = evaluate_pr(repo, pr)
        if not result:
            continue
        results.append(result)

        if args.publish_status:
            if result["state"] == "READY":
                description = "Ready for Manager review; claim, evidence and required CI are verified"
            elif result["state"] == "WAITING":
                description = "Waiting: " + (result["reasons"][0] if result["reasons"] else "pending review prerequisites")
            else:
                description = "Blocked: " + (result["reasons"][0] if result["reasons"] else "review prerequisite failed")
            publish_status(
                repo,
                result["head_sha"],
                result["state"],
                description,
                result.get("pr_url"),
            )

    payload = {
        "repo": repo,
        "agent_pr_count": len(results),
        "ready": sum(1 for r in results if r["state"] == "READY"),
        "waiting": sum(1 for r in results if r["state"] == "WAITING"),
        "blocked": sum(1 for r in results if r["state"] == "BLOCKED"),
        "prs": results,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(
            f"Manager readiness: {len(results)} agent PR(s), "
            f"{payload['ready']} ready, {payload['waiting']} waiting, "
            f"{payload['blocked']} blocked"
        )
        for r in results:
            reason = "; ".join(r["reasons"]) if r["reasons"] else "all prerequisites satisfied"
            print(f"- {r['state']}: PR #{r['pr_number']} {r['subgoal_id']} — {reason}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## Manager Review Readiness\n\n")
            f.write(f"- Ready: **{payload['ready']}**\n")
            f.write(f"- Waiting: **{payload['waiting']}**\n")
            f.write(f"- Blocked: **{payload['blocked']}**\n\n")
            for r in results:
                f.write(f"- **{r['state']}** PR #{r['pr_number']} — `{r['subgoal_id']}`")
                if r["reasons"]:
                    f.write(" — " + "; ".join(r["reasons"]))
                f.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
