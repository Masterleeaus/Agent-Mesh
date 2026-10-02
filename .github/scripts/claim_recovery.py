"""Pure policy checks for deciding whether a mission claim may be resumed."""
from datetime import datetime, timedelta, timezone


def _timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("claim timestamps must include a timezone")
    return parsed.astimezone(timezone.utc)


def stale_claim_blockers(*, now: datetime, issue_updated_at: str, issue_is_open: bool,
                         open_pr_uses_branch: bool, ahead_by: int,
                         latest_pr_activity_at: str | None = None) -> list[str]:
    """Return blockers; an empty list means same-ref stale takeover is eligible.

    ``issue_updated_at`` is GitHub's issue updated timestamp, which changes on
    issue edits and comments. The caller must re-fetch all inputs immediately
    before acting and must separately post the takeover comment.
    """
    if now.tzinfo is None:
        raise ValueError("now must include a timezone")
    blockers = []
    if not issue_is_open:
        blockers.append("issue-not-open")
    if _timestamp(issue_updated_at) > now.astimezone(timezone.utc) - timedelta(hours=1):
        blockers.append("issue-active-within-one-hour")
    if open_pr_uses_branch:
        blockers.append("open-pr-uses-claim-branch")
    if latest_pr_activity_at and _timestamp(latest_pr_activity_at) > now.astimezone(timezone.utc) - timedelta(hours=1):
        blockers.append("pr-active-within-one-hour")
    if ahead_by < 0:
        raise ValueError("ahead_by cannot be negative")
    if ahead_by > 0:
        blockers.append("claim-branch-has-unique-commits")
    return blockers
