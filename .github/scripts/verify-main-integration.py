#!/usr/bin/env python3
"""Detect direct product-code pushes to canonical main.

This is a CI fallback, not a substitute for GitHub branch protection.
Manager/control-plane metadata may be pushed directly, but product/source changes
must be associated with a merged pull request.
"""

import argparse
import json
import os
import subprocess
from pathlib import Path

CONTROL_PREFIXES = (
    ".github/",
    "work/",
    "roadmap/",
    "docs/",
)
CONTROL_FILES = {
    "AGENTS.md",
    "README.md",
    "CLAUDE.md",
}
PRODUCT_EXTENSIONS = (
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".php", ".py", ".go", ".rs", ".java", ".kt",
    ".sql", ".prisma", ".graphql", ".gql",
)


def run(args, *, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "command failed").strip())
    return proc


def run_json(args):
    proc = run(args)
    return json.loads(proc.stdout or "null")


def is_control_plane_path(path: str) -> bool:
    if path in CONTROL_FILES:
        return True
    return any(path.startswith(prefix) for prefix in CONTROL_PREFIXES)


def requires_pr(path: str) -> bool:
    if is_control_plane_path(path):
        return False
    # Everything outside the explicit control-plane allowlist is treated as
    # product/release/runtime state. Source-like extensions are called out for
    # readability, but unknown files are also protected by default.
    return True


def classify_commit(changed_files, merged_pr_numbers):
    protected = sorted({p for p in changed_files if requires_pr(p)})
    if not protected:
        return "CONTROL_PLANE_DIRECT_PUSH_ALLOWED", protected
    if merged_pr_numbers:
        return "PR_INTEGRATED_PRODUCT_CHANGE", protected
    return "DIRECT_PRODUCT_PUSH_VIOLATION", protected


def self_test():
    state, files = classify_commit(
        [".github/workflows/x.yml", "work/README.md"],
        [],
    )
    assert state == "CONTROL_PLANE_DIRECT_PUSH_ALLOWED"
    assert files == []

    state, files = classify_commit(
        ["apps/web/app/page.tsx"],
        [42],
    )
    assert state == "PR_INTEGRATED_PRODUCT_CHANGE"
    assert files == ["apps/web/app/page.tsx"]

    state, files = classify_commit(
        ["packages/domain/src/index.ts", "docs/note.md"],
        [],
    )
    assert state == "DIRECT_PRODUCT_PUSH_VIOLATION"
    assert files == ["packages/domain/src/index.ts"]

    state, files = classify_commit(
        ["pnpm-lock.yaml"],
        [],
    )
    assert state == "DIRECT_PRODUCT_PUSH_VIOLATION"
    assert files == ["pnpm-lock.yaml"]

    print("verify-main-integration self-test OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    repo = os.environ.get("GITHUB_REPOSITORY")
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not repo or not event_path:
        raise SystemExit("GITHUB_REPOSITORY and GITHUB_EVENT_PATH are required")

    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    ref = event.get("ref")
    if ref != "refs/heads/main":
        print(f"Not a main push ({ref}); nothing to validate.")
        return 0

    commits = event.get("commits") or []
    if not commits and event.get("after"):
        commits = [{"id": event["after"]}]

    records = []
    violations = []

    for item in commits:
        sha = item.get("id") or item.get("sha")
        if not sha:
            continue

        detail = run_json(["gh", "api", f"repos/{repo}/commits/{sha}"])
        changed_files = [
            f.get("filename")
            for f in (detail.get("files") or [])
            if f.get("filename")
        ]

        prs = run_json([
            "gh", "api",
            "-H", "Accept: application/vnd.github+json",
            f"repos/{repo}/commits/{sha}/pulls",
        ]) or []
        merged_prs = sorted({
            int(pr["number"])
            for pr in prs
            if pr.get("merged_at")
        })

        classification, protected = classify_commit(changed_files, merged_prs)
        record = {
            "sha": sha,
            "message": ((detail.get("commit") or {}).get("message") or "").splitlines()[0],
            "classification": classification,
            "merged_pr_numbers": merged_prs,
            "changed_files": changed_files,
            "protected_product_files": protected,
        }
        records.append(record)
        if classification == "DIRECT_PRODUCT_PUSH_VIOLATION":
            violations.append(record)

    payload = {
        "repo": repo,
        "main_push_commit_count": len(records),
        "violation_count": len(violations),
        "commits": records,
    }

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## Canonical Main Integration Check\n\n")
            f.write(f"- Commits checked: **{len(records)}**\n")
            f.write(f"- Direct product-push violations: **{len(violations)}**\n\n")
            for record in records:
                f.write(
                    f"- `{record['sha'][:12]}` — **{record['classification']}**"
                    f" — {record['message']}\n"
                )

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        for record in records:
            print(
                f"{record['classification']}: {record['sha'][:12]} "
                f"PRs={record['merged_pr_numbers']} files={len(record['changed_files'])}"
            )

    if violations:
        print(
            "\nDirect product/runtime changes were pushed to main without a merged PR.",
            file=sys.stderr,
        )
        for record in violations:
            print(
                f"- {record['sha']}: {', '.join(record['protected_product_files'][:20])}",
                file=sys.stderr,
            )
        print(
            "GitHub repository admin/ruleset write access is not available to this "
            "integration, so this CI check is the enforcement fallback. Move product "
            "changes through agent/<subgoal-id> -> PR -> Manager merge.",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main())
