from src.models import AnalyticsAggregationInput, AnalyticsAggregationOutput, AggregatedMetrics
from lemma_sdk import FunctionContext, Pod
from datetime import datetime, timezone


def _parse_ts(ts_str):
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


async def analytics_aggregation(ctx: FunctionContext, data: AnalyticsAggregationInput) -> AnalyticsAggregationOutput:
    pod = Pod.from_env()

    date_to = data.date_to or data.date_from
    start_dt = datetime(data.date_from.year, data.date_from.month, data.date_from.day, tzinfo=timezone.utc)
    end_dt = datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59, tzinfo=timezone.utc)

    all_tickets = pod.records.list("tickets")
    all_appointments = pod.records.list("appointments")
    all_customers = pod.records.list("customers")
    all_users = pod.records.list("users")

    tickets_in_range = []
    resolution_diffs = []
    tickets_by_status = {}
    tickets_by_urgency = {}

    for ticket in all_tickets:
        created = _parse_ts(ticket.get("created_at"))
        if created and start_dt <= created <= end_dt:
            tickets_in_range.append(ticket)

        status = ticket.get("status", "unknown")
        tickets_by_status[status] = tickets_by_status.get(status, 0) + 1

        urgency = ticket.get("urgency", "unknown")
        tickets_by_urgency[urgency] = tickets_by_urgency.get(urgency, 0) + 1

        created_ts = _parse_ts(ticket.get("created_at"))
        resolved_ts = _parse_ts(ticket.get("resolved_at") or ticket.get("closed_at"))
        if created_ts and resolved_ts:
            diff_hours = (resolved_ts - created_ts).total_seconds() / 3600
            if diff_hours >= 0:
                resolution_diffs.append(diff_hours)

    open_tickets = sum(1 for t in tickets_in_range if t.get("status") in ("new", "open", "in_progress", "classified", "drafted"))
    closed_tickets = sum(1 for t in tickets_in_range if t.get("status") in ("closed", "resolved", "sent"))
    avg_resolution = sum(resolution_diffs) / len(resolution_diffs) if resolution_diffs else 0.0

    appointments_in_range = []
    completed_appts = 0
    cancelled_appts = 0
    for appt in all_appointments:
        created = _parse_ts(appt.get("created_at") or appt.get("scheduled_at"))
        if created and start_dt <= created <= end_dt:
            appointments_in_range.append(appt)
            if appt.get("status") == "completed":
                completed_appts += 1
            elif appt.get("status") == "cancelled":
                cancelled_appts += 1

    total_technicians = sum(1 for u in all_users if u.get("role") == "technician")

    metrics = AggregatedMetrics(
        total_tickets=len(tickets_in_range),
        open_tickets=open_tickets,
        closed_tickets=closed_tickets,
        avg_resolution_time_hours=round(avg_resolution, 2),
        total_appointments=len(appointments_in_range),
        completed_appointments=completed_appts,
        cancelled_appointments=cancelled_appts,
        total_customers=len(all_customers),
        total_technicians=total_technicians,
        tickets_by_status=tickets_by_status,
        tickets_by_urgency=tickets_by_urgency,
    )

    return AnalyticsAggregationOutput(
        period=data.period,
        date_from=data.date_from,
        date_to=date_to,
        metrics=metrics,
    )