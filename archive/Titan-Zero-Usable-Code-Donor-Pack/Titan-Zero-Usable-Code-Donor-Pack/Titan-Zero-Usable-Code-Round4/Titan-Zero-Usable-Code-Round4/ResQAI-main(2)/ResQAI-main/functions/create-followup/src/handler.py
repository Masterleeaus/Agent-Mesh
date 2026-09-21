#input_type_name: CreateFollowupInput
#output_type_name: CreateFollowupOutput
#function_name: create_followup

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import CreateFollowupInput, CreateFollowupOutput


async def create_followup(ctx: FunctionContext, data: CreateFollowupInput) -> CreateFollowupOutput:
    pod = Pod.from_env()

    account = pod.records.get("accounts", data.account_id)
    if not account:
        return CreateFollowupOutput(
            status="error",
            error=f"Account {data.account_id} not found",
        )

    followup = pod.records.create("followups", {
        "account_id": data.account_id,
        "customer_id": data.customer_id,
        "type": data.type,
        "subject": data.subject,
        "priority": data.priority,
        "status": "pending",
        "due_date": data.due_date,
        "assigned_to": data.assigned_to,
        "related_ticket_id": data.related_ticket_id,
        "related_appointment_id": data.related_appointment_id,
        "related_dispute_id": data.related_dispute_id,
        "notes": data.notes,
        "created_by": data.created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    open_followups = (account.get("open_followups") or 0) + 1
    pod.records.update("accounts", data.account_id, {
        "open_followups": open_followups,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    pod.records.create("operations_log", {
        "action": "create_followup",
        "result": f"followup_id={followup['id']}, account_id={data.account_id}",
        "actor": data.created_by or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return CreateFollowupOutput(status="success", followup_id=followup["id"])
