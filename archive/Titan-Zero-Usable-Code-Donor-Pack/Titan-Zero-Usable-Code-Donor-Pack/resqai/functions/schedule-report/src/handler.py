from datetime import datetime, timedelta

from lemma_sdk import FunctionContext, Pod

from src.models import ScheduleReportInput, ScheduleReportOutput


def _compute_next_scheduled(frequency: str) -> str:
    now = datetime.utcnow()
    if frequency == "daily":
        next_time = now + timedelta(days=1)
    elif frequency == "weekly":
        next_time = now + timedelta(weeks=1)
    elif frequency == "monthly":
        next_time = now + timedelta(days=30)
    else:
        next_time = now + timedelta(days=1)
    return next_time.replace(hour=6, minute=0, second=0, microsecond=0).isoformat()


async def schedule_report(ctx: FunctionContext, data: ScheduleReportInput) -> ScheduleReportOutput:
    pod = Pod.from_env()

    report = pod.records.get("analytics_reports", data.report_id)
    if not report:
        return ScheduleReportOutput(
            status="not_found",
            error=f"Report {data.report_id} not found",
        )

    now = datetime.utcnow().isoformat()
    next_run = _compute_next_scheduled(data.frequency)

    record = pod.records.create("analytics_schedules", {
        "report_id": data.report_id,
        "frequency": data.frequency,
        "recipients": data.recipients,
        "format": data.format,
        "is_active": data.is_active,
        "next_scheduled_at": next_run,
        "created_at": now,
        "updated_at": now,
    })

    pod.records.create("operations_log", {
        "action": "report scheduled",
        "result": f"report_id={data.report_id}, schedule_id={record.get('id')}, frequency={data.frequency}",
        "actor": "system",
    })

    return ScheduleReportOutput(status="success", schedule_id=record.get("id"))
