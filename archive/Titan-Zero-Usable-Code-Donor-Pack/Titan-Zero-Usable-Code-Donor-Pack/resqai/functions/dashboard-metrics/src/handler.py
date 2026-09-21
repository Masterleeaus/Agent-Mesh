from src.models import DashboardMetricsInput, DashboardMetricsOutput
from lemma_sdk import FunctionContext, Pod


async def dashboard_metrics(ctx: FunctionContext, data: DashboardMetricsInput) -> DashboardMetricsOutput:
    pod = Pod.from_env()

    all_tickets = pod.records.list("tickets")
    all_appointments = pod.records.list("appointments")
    all_customers = pod.records.list("customers")
    all_users = pod.records.list("users")
    all_health = pod.records.list("account_health")
    all_followups = pod.records.list("followups")
    all_work_orders = pod.records.list("work_orders")

    tickets_by_status = {}
    tickets_by_urgency = {}
    for ticket in all_tickets:
        s = ticket.get("status", "unknown")
        tickets_by_status[s] = tickets_by_status.get(s, 0) + 1
        u = ticket.get("urgency", "unknown")
        tickets_by_urgency[u] = tickets_by_urgency.get(u, 0) + 1

    tickets_summary = {
        "total": len(all_tickets),
        "by_status": tickets_by_status,
        "by_urgency": tickets_by_urgency,
    }

    appts_by_status = {}
    for appt in all_appointments:
        s = appt.get("status", "unknown")
        appts_by_status[s] = appts_by_status.get(s, 0) + 1

    appointments_summary = {
        "total": len(all_appointments),
        "by_status": appts_by_status,
    }

    technicians = [u for u in all_users if u.get("role") == "technician"]
    open_work_orders = [wo for wo in all_work_orders if wo.get("status") not in ("completed", "cancelled")]

    technician_summary = {
        "total_technicians": len(technicians),
        "active_work_orders": len(open_work_orders),
    }

    health_scores = [h.get("score", 0) for h in all_health if h.get("score") is not None]
    avg_health = sum(health_scores) / len(health_scores) if health_scores else 0.0

    account_health_summary = {
        "total_accounts": len(all_health),
        "average_score": round(avg_health, 2),
        "healthy_count": sum(1 for h in all_health if (h.get("score") or 0) >= 80),
        "at_risk_count": sum(1 for h in all_health if (h.get("score") or 0) < 80),
    }

    now_ts = None
    pending_followups = 0
    overdue_followups = 0
    for fu in all_followups:
        status = fu.get("status", "")
        if status == "pending":
            pending_followups += 1
        elif status == "overdue":
            overdue_followups += 1

    followup_summary = {
        "total": len(all_followups),
        "pending": pending_followups,
        "overdue": overdue_followups,
    }

    trends = None
    if data.include_trends:
        trends = {
            "total_tickets": len(all_tickets),
            "total_appointments": len(all_appointments),
            "total_customers": len(all_customers),
        }

    return DashboardMetricsOutput(
        tickets_summary=tickets_summary,
        appointments_summary=appointments_summary,
        technician_summary=technician_summary,
        account_health_summary=account_health_summary,
        followup_summary=followup_summary,
        trends=trends,
    )