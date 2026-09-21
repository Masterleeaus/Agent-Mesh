from datetime import date
from typing import Optional

from .models import AccountHealthRow, AccountRiskSignal


RELATIONSHIP_PENALTY = {
    "new": 0.0, "active": 0.0, "watch": 0.05,
    "at_risk": 0.25, "in_dispute": 0.35,
    "dormant": 0.30, "won_back": 0.05, "churned": 0.40,
}


def _parse_date(raw) -> date:
    if isinstance(raw, str) and len(raw) >= 10:
        return date.fromisoformat(raw[:10])
    if isinstance(raw, date):
        return raw
    raise ValueError(f"unexpected date payload: {raw!r}")


def _days_since(today: date, raw) -> Optional[int]:
    if not raw:
        return None
    try:
        d = _parse_date(raw)
    except Exception:
        return None
    return (today - d).days


def classify_score(score: float) -> str:
    if score >= 0.80:
        return "healthy"
    if score >= 0.60:
        return "watch"
    if score >= 0.35:
        return "slipping"
    return "critical"


def compute_account_health(
    today: date,
    lookback_days: int,
    relationship_overrides: dict[str, str],
    acc: dict,
    customer: dict,
    acct_followups: list[dict],
    open_dispute_count: int,
    critical_dispute_count: int,
) -> AccountHealthRow:
    rel_status = relationship_overrides.get(acc["id"], acc.get("relationship_status", "active"))

    open_followups = sum(1 for f in acct_followups if f.get("status") in {"pending", "in_progress"})
    overdue_followups = sum(
        1 for f in acct_followups
        if f.get("status") in {"pending", "in_progress"}
        and f.get("due_date") and (today - _parse_date(f["due_date"])).days > 0
    )

    last_contact_days = _days_since(today, acc.get("last_contact_date"))
    last_service_days = _days_since(today, acc.get("last_service_date"))

    score = 1.0
    signposts: list[AccountRiskSignal] = []

    if last_contact_days is not None and last_contact_days > lookback_days:
        penalty = min(0.40, (last_contact_days - lookback_days) / 365.0 * 0.6 + 0.15)
        score -= penalty
        signposts.append(AccountRiskSignal(label="no_contact", weight=round(penalty, 3)))

    if last_service_days is None and (acc.get("lifetime_jobs") or 0) == 0:
        penalty = 0.15
        score -= penalty
        signposts.append(AccountRiskSignal(label="no_service", weight=penalty))
    elif last_service_days is not None and last_service_days > lookback_days * 1.5:
        penalty = 0.20
        score -= penalty
        signposts.append(AccountRiskSignal(label="no_service", weight=penalty))

    if overdue_followups >= 6 or overdue_followups * 10 > max(1, open_followups) * 4:
        penalty = 0.20
        score -= penalty
        signposts.append(AccountRiskSignal(label="high_overdue_followups", weight=penalty))
    elif overdue_followups > 0:
        penalty = min(0.15, 0.04 * overdue_followups)
        score -= penalty
        signposts.append(AccountRiskSignal(label="high_overdue_followups", weight=round(penalty, 3)))

    if open_dispute_count > 0:
        penalty = 0.15
        score -= penalty
        signposts.append(AccountRiskSignal(label="open_dispute", weight=penalty))

    if critical_dispute_count > 0:
        penalty = 0.25
        score -= penalty
        signposts.append(AccountRiskSignal(label="critical_dispute", weight=penalty))

    if (acc.get("lifetime_jobs") or 0) <= 2 and rel_status in {"active", "watch"}:
        penalty = 0.05
        score -= penalty
        signposts.append(AccountRiskSignal(label="single_service_relationship", weight=penalty))

    stale = rel_status in {"dormant", "at_risk", "in_dispute"} and last_contact_days is not None and last_contact_days > lookback_days
    if stale:
        penalty = RELATIONSHIP_PENALTY.get(rel_status, 0.0)
        score -= penalty
        if penalty > 0:
            signposts.append(AccountRiskSignal(label="stale_relationship_status", weight=round(penalty, 3)))

    score = max(0.0, min(1.0, score))
    new_health = classify_score(score)
    prior_score = acc.get("health_score")
    prior_health = acc.get("health", "healthy")
    score_delta = score - (prior_score or score)

    bits = []
    if last_contact_days is not None:
        bits.append(f"last contact {last_contact_days}d ago")
    else:
        bits.append("no contact recorded")
    if overdue_followups:
        bits.append(f"{overdue_followups} overdue follow-ups")
    if open_dispute_count:
        bits.append(f"{open_dispute_count} open dispute(s)")
    summary = "; ".join(bits) or "no risk signals"

    return AccountHealthRow(
        account_id=acc["id"],
        customer_id=acc["customer_id"],
        name=acc.get("name") or customer.get("name") or "Unknown",
        relationship_status=rel_status,
        prior_health=prior_health,
        new_health=new_health,
        prior_score=prior_score,
        new_score=round(score, 3),
        score_delta=round(score_delta, 3),
        open_followups=open_followups,
        overdue_followups=overdue_followups,
        open_disputes=open_dispute_count,
        days_since_last_contact=last_contact_days,
        days_since_last_service=last_service_days,
        signposts=signposts,
        summary=summary,
    )


def compute_open_dispute_counts(
    disputes: list[dict],
    appts_by_customer: dict[str, list[dict]],
    customer_id: str,
) -> tuple[int, int]:
    cust_appts = appts_by_customer.get(customer_id, [])
    appt_ids = {a["id"] for a in cust_appts}
    open_dispute_count = sum(1 for d in disputes if d["appointment_id"] in appt_ids)
    critical_dispute_count = sum(
        1 for d in disputes
        if d["appointment_id"] in appt_ids
        and (
            d.get("recommended_resolution") in {"refund", "redo_service"}
            or d.get("status") == "investigating"
        )
    )
    return open_dispute_count, critical_dispute_count


def sort_rows_riskiest_first(rows: list[AccountHealthRow]) -> list[AccountHealthRow]:
    return sorted(rows, key=lambda r: (r.new_score, -r.open_disputes, -r.overdue_followups))
