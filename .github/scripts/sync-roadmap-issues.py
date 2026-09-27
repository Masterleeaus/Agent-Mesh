import json
import os
import re
import subprocess
import time

REPO = os.environ["GITHUB_REPOSITORY"]
MANIFEST_PATH = "roadmap/SUBGOAL-ISSUE-MANIFEST.json"


def run(args, check=True):
    proc = subprocess.run(args, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "").strip())
    return proc


def issue_list():
    proc = run([
        "gh", "issue", "list",
        "--repo", REPO,
        "--state", "all",
        "--limit", "1000",
        "--json", "number,title,state",
    ])
    return json.loads(proc.stdout)


def id_from_title(title):
    match = re.match(r"^\[([A-Z0-9-]+-SG-\d+)\]", title or "")
    return match.group(1) if match else None


def goal_num(goal_id):
    if goal_id == "TZ-G00":
        return 0
    match = re.search(r"(\d+)$", goal_id)
    return int(match.group(1)) + 1 if match else 9999


def subgoal_num(subgoal_id):
    match = re.search(r"SG-(\d+)$", subgoal_id)
    return int(match.group(1)) if match else 9999


with open(MANIFEST_PATH, encoding="utf-8") as f:
    manifest = json.load(f)

existing = {}
duplicates = {}
for issue in issue_list():
    sid = id_from_title(issue.get("title"))
    if not sid:
        continue
    if sid in existing:
        duplicates.setdefault(sid, [existing[sid]]).append(issue)
    else:
        existing[sid] = issue

manifest.sort(key=lambda item: (goal_num(item["goal_id"]), subgoal_num(item["subgoal_id"])))

created = 0
skipped = 0

for item in manifest:
    sid = item["subgoal_id"]
    if sid in existing:
        skipped += 1
        continue

    full_title = item["title"].strip()
    prefix = f"[{sid}] "
    available = 250 - len(prefix)
    display_title = full_title
    if len(display_title) > available:
        display_title = display_title[: max(1, available - 1)].rstrip() + "…"
    title = prefix + display_title

    body = "\n".join([
        "## Roadmap work item",
        "",
        f"**Subgoal:** `{sid}`",
        f"**Goal:** `{item['goal_id']}` — {item['goal_title']}",
        f"**Full subgoal title:** {full_title}",
        f"**Roadmap status:** `{item['status']}`",
        f"**Priority:** {item['priority']}",
        f"**MVP required:** {'Yes' if item.get('mvp_required') else 'No'}",
        "**Execution:** Claimable roadmap subgoal",
        "",
        "### V3 workflow",
        "1. Claim this issue before implementation.",
        "2. Branch from current GitHub `main`.",
        "3. Deep-scan current canonical code and verified donor implementations before building.",
        "4. Implement only remaining work and preserve completed evidence.",
        "5. Commit/push the dedicated branch and open/update a linked pull request.",
        "6. Run relevant tests/CI and record verification evidence.",
        "7. Manager review + merge to `main` establishes canonical code.",
        "",
        "### Architecture guardrails",
        "- `company_id` is the canonical company boundary.",
        "- Reuse/converge existing capabilities before creating parallel implementations.",
        "- Command Bus/Governance/Autonomy/Risk/Assurance remain authority boundaries where applicable.",
        "- Architecture and workforce specifications are referenced, not duplicated into this issue.",
        "- Titan Code remains private development-only and is not a Titan Zero production runtime dependency.",
        "",
        "Migrated from the authoritative Agent Mesh roadmap into GitHub Issues.",
    ])

    cmd = ["gh", "issue", "create", "--repo", REPO, "--title", title, "--body", body]
    last_error = ""
    for attempt in range(8):
        proc = run(cmd, check=False)
        if proc.returncode == 0:
            created += 1
            existing[sid] = {"title": title, "url": proc.stdout.strip()}
            print(f"CREATED {sid}: {proc.stdout.strip()}", flush=True)
            break

        last_error = (proc.stderr or proc.stdout or "").strip()
        lower = last_error.lower()
        if "secondary rate" in lower or "abuse" in lower or "rate limit" in lower:
            delay = min(180, 30 * (attempt + 1))
            print(f"RATE-LIMIT {sid}; sleeping {delay}s", flush=True)
            time.sleep(delay)
            continue
        raise RuntimeError(f"Failed creating {sid}: {last_error}")
    else:
        raise RuntimeError(f"Failed creating {sid} after retries: {last_error}")

    time.sleep(0.8)

final = {}
for issue in issue_list():
    sid = id_from_title(issue.get("title"))
    if sid and sid not in final:
        final[sid] = issue

# Keep issue state aligned with roadmap state without deleting audit history.
closed_superseded = 0
closed_complete = 0
for item in manifest:
    sid = item["subgoal_id"]
    issue = final.get(sid)
    if not issue or issue.get("state") != "OPEN":
        continue

    if item["status"] == "SUPERSEDED_BY_ARCHITECTURE":
        run([
            "gh", "api", "--method", "PATCH",
            f"repos/{REPO}/issues/{issue['number']}",
            "-f", "state=closed",
            "-f", "state_reason=not_planned",
        ])
        closed_superseded += 1
        time.sleep(0.8)
    elif item["status"] == "COMPLETE":
        run([
            "gh", "api", "--method", "PATCH",
            f"repos/{REPO}/issues/{issue['number']}",
            "-f", "state=closed",
            "-f", "state_reason=completed",
        ])
        closed_complete += 1
        time.sleep(0.8)

final = {}
for issue in issue_list():
    sid = id_from_title(issue.get("title"))
    if sid and sid not in final:
        final[sid] = issue

missing = [item["subgoal_id"] for item in manifest if item["subgoal_id"] not in final]

print(json.dumps({
    "manifest_count": len(manifest),
    "created": created,
    "already_present": skipped,
    "verified_present": len(manifest) - len(missing),
    "missing": missing,
    "preexisting_duplicates": sorted(duplicates),
    "closed_superseded": closed_superseded,
    "closed_complete": closed_complete,
}, indent=2))

if missing:
    raise SystemExit(f"Roadmap issue sync incomplete; {len(missing)} missing")
