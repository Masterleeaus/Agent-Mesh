"""Fail-closed checks and same-ref reservation for stale mission claims.

The caller must assemble a fresh snapshot from GitHub issue, comment, PR,
review, ref/push-event, and Actions APIs. This module validates that snapshot;
it does not authenticate to GitHub or treat missing telemetry as inactivity.
"""
from datetime import datetime, timedelta, timezone
import re
import subprocess

QUIET_WINDOW = timedelta(hours=1)
SNAPSHOT_MAX_AGE = timedelta(minutes=5)
REQUIRED_SOURCES = (
    "issue",
    "issue_comments",
    "owner_status_updates",
    "pull_requests",
    "pull_requests_complete",
    "branch",
    "main",
    "repository_push_events",
    "workflow_runs",
)
ACTIVE_RUN_STATES = {"queued", "in_progress", "waiting", "requested", "pending"}
SHA = re.compile(r"^[0-9a-f]{40}$")


def _timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("claim timestamps must include a timezone")
    return parsed.astimezone(timezone.utc)


def _fresh_observation(source: dict, *, now: datetime, name: str, blockers: list[str]) -> None:
    observed_at = source.get("observed_at")
    if not isinstance(observed_at, str):
        blockers.append(f"missing-activity-source:{name}")
        return
    try:
        observed = _timestamp(observed_at)
    except (TypeError, ValueError):
        blockers.append(f"invalid-activity-source:{name}")
        return
    age = now.astimezone(timezone.utc) - observed
    if age < timedelta(0) or age > SNAPSHOT_MAX_AGE:
        blockers.append(f"stale-activity-snapshot:{name}")


def _record_events(source: dict, keys: tuple[str, ...], *, cutoff: datetime,
                   name: str, blockers: list[str]) -> None:
    for key in keys:
        values = source.get(key)
        if not isinstance(values, list):
            blockers.append(f"missing-activity-events:{name}.{key}")
            continue
        for value in values:
            try:
                if _timestamp(value) > cutoff:
                    blockers.append(f"activity-within-one-hour:{name}.{key}")
                    break
            except (TypeError, ValueError):
                blockers.append(f"invalid-activity-event:{name}.{key}")
                break


def stale_claim_blockers(*, now: datetime, branch_name: str,
                         activity_snapshot: dict) -> list[str]:
    """Validate a freshly collected snapshot; empty means same-ref continuation is eligible.

    A quiet open PR or unique commits do not discard useful work. Eligibility
    means continue on the exact claim ref, preserve its history and PR, and
    reserve the observed head with a normal non-forced fast-forward push before
    editing. The caller must stop if reservation loses its compare-and-swap.
    """
    if now.tzinfo is None:
        raise ValueError("now must include a timezone")
    if not re.fullmatch(r"agent/issue-[0-9]+", branch_name):
        raise ValueError("branch_name must be the exact agent/issue-N ref")
    blockers: list[str] = []
    if not isinstance(activity_snapshot, dict):
        return blockers + ["missing-activity-snapshot"]

    now = now.astimezone(timezone.utc)
    cutoff = now - QUIET_WINDOW
    observed_at = activity_snapshot.get("observed_at")
    try:
        if not isinstance(observed_at, str):
            raise ValueError("missing timestamp")
        age = now - _timestamp(observed_at)
        if age < timedelta(0) or age > SNAPSHOT_MAX_AGE:
            blockers.append("activity-snapshot-not-fresh")
    except (TypeError, ValueError):
        blockers.append("activity-snapshot-invalid")

    missing = [name for name in REQUIRED_SOURCES if name not in activity_snapshot]
    blockers.extend(f"missing-activity-source:{name}" for name in missing)

    issue = activity_snapshot.get("issue")
    if isinstance(issue, dict):
        _fresh_observation(issue, now=now, name="issue", blockers=blockers)
        if issue.get("state") != "open":
            blockers.append("issue-not-open")
        try:
            if _timestamp(issue["updated_at"]) > cutoff:
                blockers.append("issue-active-within-one-hour")
        except (KeyError, TypeError, ValueError):
            blockers.append("invalid-issue-activity")
    else:
        blockers.append("invalid-activity-source:issue")

    for name in ("issue_comments", "owner_status_updates"):
        source = activity_snapshot.get(name)
        if isinstance(source, dict):
            _fresh_observation(source, now=now, name=name, blockers=blockers)
            if source.get("complete") is not True:
                blockers.append(f"incomplete-activity-source:{name}")
            _record_events(source, ("updated_at",), cutoff=cutoff, name=name, blockers=blockers)
        else:
            blockers.append(f"invalid-activity-source:{name}")

    branch = activity_snapshot.get("branch")
    if isinstance(branch, dict):
        _fresh_observation(branch, now=now, name="branch", blockers=blockers)
        if branch.get("complete") is not True:
            blockers.append("incomplete-activity-source:branch")
        head = branch.get("head_sha")
        if not isinstance(head, str) or not SHA.fullmatch(head):
            blockers.append("claim-branch-head-unknown")
        if branch.get("observed_head_sha") != head:
            blockers.append("claim-branch-head-changed-during-snapshot")
    else:
        blockers.append("invalid-activity-source:branch")

    main = activity_snapshot.get("main")
    if isinstance(main, dict):
        _fresh_observation(main, now=now, name="main", blockers=blockers)
        if main.get("complete") is not True or not isinstance(main.get("head_sha"), str) or not SHA.fullmatch(main["head_sha"]):
            blockers.append("current-main-head-unknown")
    else:
        blockers.append("invalid-activity-source:main")

    pushes = activity_snapshot.get("repository_push_events")
    if isinstance(pushes, dict):
        _fresh_observation(pushes, now=now, name="repository_push_events", blockers=blockers)
        if pushes.get("complete") is not True:
            blockers.append("incomplete-activity-source:repository_push_events")
        try:
            if _timestamp(pushes["covered_since"]) > cutoff:
                blockers.append("branch-push-history-does-not-cover-quiet-window")
        except (KeyError, TypeError, ValueError):
            blockers.append("branch-push-history-coverage-unknown")
        events = pushes.get("events")
        if not isinstance(events, list):
            blockers.append("missing-activity-events:repository_push_events.events")
        else:
            for event in events:
                if not isinstance(event, dict) or event.get("ref") != f"refs/heads/{branch_name}":
                    blockers.append("invalid-activity-event:repository_push_events.events")
                    continue
                try:
                    if _timestamp(event["created_at"]) > cutoff:
                        blockers.append("activity-within-one-hour:repository_push_events.events")
                except (KeyError, TypeError, ValueError):
                    blockers.append("invalid-activity-event:repository_push_events.events")
    else:
        blockers.append("invalid-activity-source:repository_push_events")

    if activity_snapshot.get("pull_requests_complete") is not True:
        blockers.append("pull-request-list-incomplete")
    prs = activity_snapshot.get("pull_requests")
    if isinstance(prs, list):
        for index, pr in enumerate(prs):
            name = f"pull_requests[{index}]"
            if not isinstance(pr, dict):
                blockers.append(f"invalid-activity-source:{name}")
                continue
            _fresh_observation(pr, now=now, name=name, blockers=blockers)
            if pr.get("complete") is not True:
                blockers.append(f"incomplete-activity-source:{name}")
            _record_events(pr, ("updated_at", "comment_updated_at", "review_updated_at",
                                "review_comment_updated_at"), cutoff=cutoff, name=name,
                           blockers=blockers)
            if pr.get("state") == "open":
                if pr.get("head_ref") != branch_name or pr.get("head_sha") != (branch or {}).get("head_sha"):
                    blockers.append("open-pr-does-not-match-claim-head")
                if pr.get("base_ref") != "main":
                    blockers.append("open-pr-does-not-target-main")
    else:
        blockers.append("invalid-activity-source:pull_requests")

    runs = activity_snapshot.get("workflow_runs")
    if isinstance(runs, dict):
        _fresh_observation(runs, now=now, name="workflow_runs", blockers=blockers)
        if runs.get("complete") is not True:
            blockers.append("incomplete-activity-source:workflow_runs")
        try:
            if _timestamp(runs["covered_since"]) > cutoff:
                blockers.append("workflow-history-does-not-cover-quiet-window")
        except (KeyError, TypeError, ValueError):
            blockers.append("workflow-history-coverage-unknown")
        _record_events(runs, ("updated_at",), cutoff=cutoff, name="workflow_runs", blockers=blockers)
        statuses = runs.get("statuses")
        if not isinstance(statuses, list):
            blockers.append("missing-activity-events:workflow_runs.statuses")
        elif any(status in ACTIVE_RUN_STATES for status in statuses):
            blockers.append("relevant-workflow-active")
    else:
        blockers.append("invalid-activity-source:workflow_runs")

    # Require empty collections as explicit evidence too; absence is unknown.
    for name in ("issue_comments", "owner_status_updates"):
        source = activity_snapshot.get(name)
        if isinstance(source, dict) and not isinstance(source.get("updated_at"), list):
            blockers.append(f"missing-activity-events:{name}.updated_at")

    return list(dict.fromkeys(blockers))


def reserve_same_ref(*, branch_name: str, observed_head: str,
                     reservation_commit: str, remote: str = "origin") -> None:
    """Reserve an exact claim ref with a normal fast-forward push (CAS winner).

    ``reservation_commit`` must be a unique reservation commit whose parent is
    ``observed_head``. Competing reservation commits share that parent, so only
    the first non-forced push can advance the ref; a loser must stop.
    """
    if not re.fullmatch(r"agent/issue-[0-9]+", branch_name):
        raise ValueError("branch_name must be the exact agent/issue-N ref")
    if not SHA.fullmatch(observed_head) or not SHA.fullmatch(reservation_commit):
        raise ValueError("reservation requires full commit SHAs")
    ref = f"refs/heads/{branch_name}"
    current = subprocess.run(["git", "ls-remote", "--refs", remote, ref],
                             check=True, capture_output=True, text=True).stdout.split()
    if len(current) != 2 or current[0] != observed_head or current[1] != ref:
        raise RuntimeError("claim ref moved; stop and re-fetch all activity sources")
    ancestor = subprocess.run(["git", "merge-base", "--is-ancestor", observed_head,
                              reservation_commit], capture_output=True, text=True)
    if ancestor.returncode != 0:
        raise RuntimeError("reservation commit is not a descendant of the observed head")
    pushed = subprocess.run(["git", "push", "--porcelain", remote,
                             f"{reservation_commit}:{ref}"], capture_output=True, text=True)
    if pushed.returncode != 0:
        raise RuntimeError("claim reservation lost; stop without editing or retrying")
