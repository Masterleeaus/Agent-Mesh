from datetime import date, datetime, timedelta
from typing import Literal, Optional

from .models import SlippingFollowup


PRIORITY_wEIGHT = {"urgent": 3, "high": 2, "normal": 1, "low": 0}


def classify(days_overdue: int, priority: str) -> tuple[str, str]:
    if days_overdue > 0:
        bucket = "overdue"
        if days_overdue >= 14:
            sev = "critical"
        elif days_overdue >= 7 or priority in {"urgent", "high"}:
            sev = "high"
        elif days_overdue >= 3:
            sev = "medium"
        else:
            sev = "low"
    elif days_overdue == 0:
        bucket = "due_today"
        sev = "medium" if priority in {"urgent", "high"} else "low"
    else:
        bucket = "due_soon"
        sev = "low"
    return bucket, sev


def sort_slipping_followups(items: list[SlippingFollowup]) -> list[SlippingFollowup]:
    severity_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    bucket_rank = {"overdue": 0, "due_today": 1, "due_soon": 2}
    return sorted(items, key=lambda x: (
        bucket_rank[x.bucket],
        severity_rank[x.severity],
        -x.days_overdue,
        -PRIORITY_wEIGHT.get(x.priority, 0),
        x.due_date,
    ))


def compute_slipping_followups(
    today: date,
    days_ahead: int,
    include_statuses: list[str],
    followups_all: list[dict],
    accounts_by_id: dict[str, dict],
    customers_by_id: dict[str, dict],
) -> tuple[list[SlippingFollowup], dict]:
    horizon = today + timedelta(days=days_ahead)

    followups_filtered = [f for f in followups_all if f.get("status") in include_statuses]
    followups_filtered.sort(key=lambda f: f.get("due_date") or "9999-12-31")

    slipping: list[SlippingFollowup] = []
    overdue_count = 0
    due_today_count = 0
    due_soon_count = 0
    excluded_completed = 0
    excluded_outside_window = 0

    for f in followups_filtered:
        due_date_raw = f.get("due_date")
        if not due_date_raw:
            excluded_outside_window += 1
            continue

        if isinstance(due_date_raw, str) and len(due_date_raw) >= 10:
            try:
                due = date.fromisoformat(due_date_raw[:10])
            except ValueError:
                continue
        else:
            continue

        days_overdue = (today - due).days

        if days_overdue < -days_ahead:
            excluded_outside_window += 1
            continue

        bucket, severity = classify(days_overdue, f.get("priority", "normal"))
        if bucket == "overdue":
            overdue_count += 1
        elif bucket == "due_today":
            due_today_count += 1
        else:
            due_soon_count += 1

        account = accounts_by_id.get(f.get("account_id")) or {}
        customer = customers_by_id.get(account.get("customer_id")) or {}
        customer_name = account.get("name") or customer.get("name") or "Unknown account"

        slipping.append(SlippingFollowup(
            followup_id=f["id"],
            account_id=f.get("account_id"),
            customer_id=f.get("customer_id"),
            customer_name=customer_name,
            subject=f.get("subject", ""),
            type=f.get("type", "check_in"),
            status=f.get("status", "pending"),
            priority=f.get("priority", "normal"),
            due_date=due.isoformat(),
            days_overdue=days_overdue,
            severity=severity,
            bucket=bucket,
            owner=f.get("owner") or account.get("owner"),
            related_appointment_id=f.get("related_appointment_id"),
            related_ticket_id=f.get("related_ticket_id"),
            notes=f.get("notes"),
        ))

    slipping = sort_slipping_followups(slipping)

    counts = {
        "total_scanned": len(followups_filtered),
        "slipping": len(slipping),
        "overdue": overdue_count,
        "due_today": due_today_count,
        "due_soon": due_soon_count,
        "excluded_completed": excluded_completed,
        "excluded_outside_window": excluded_outside_window,
    }

    window = {
        "days_ahead": days_ahead,
        "from": today.isoformat(),
        "to": horizon.isoformat(),
    }

    return slipping, counts, window
