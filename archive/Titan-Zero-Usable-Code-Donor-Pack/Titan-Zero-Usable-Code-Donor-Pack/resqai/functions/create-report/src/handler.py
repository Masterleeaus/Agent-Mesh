from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import CreateReportInput, CreateReportOutput


async def create_report(ctx: FunctionContext, data: CreateReportInput) -> CreateReportOutput:
    pod = Pod.from_env()

    now = datetime.utcnow().isoformat()
    record = pod.records.create("analytics_reports", {
        "name": data.name,
        "description": data.description or "",
        "config": data.config,
        "is_public": data.is_public,
        "created_by": data.created_by or "system",
        "created_at": now,
        "updated_at": now,
    })

    return CreateReportOutput(status="success", report_id=record.get("id"))
