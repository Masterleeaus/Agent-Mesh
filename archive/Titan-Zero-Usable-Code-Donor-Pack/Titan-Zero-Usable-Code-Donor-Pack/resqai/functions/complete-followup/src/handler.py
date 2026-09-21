#input_type_name: CompleteFollowupInput
#output_type_name: CompleteFollowupOutput
#function_name: complete_followup

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import CompleteFollowupInput, CompleteFollowupOutput


async def complete_followup(ctx: FunctionContext, data: CompleteFollowupInput) -> CompleteFollowupOutput:
    pod = Pod.from_env()

    followup = pod.records.get("followups", data.followup_id)
    if not followup:
        return CompleteFollowupOutput(
            status="error",
            followup_id=data.followup_id,
            error=f"Followup {data.followup_id} not found",
        )

    if followup.get("status") == "completed":
        return CompleteFollowupOutput(
            status="error",
            followup_id=data.followup_id,
            error=f"Followup {data.followup_id} is already completed",
        )

    pod.records.update("followups", data.followup_id, {
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "completed_by": data.completed_by,
        "completion_notes": data.notes,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    account = pod.records.get("accounts", followup["account_id"])
    if account:
        open_followups = max((account.get("open_followups") or 1) - 1, 0)
        pod.records.update("accounts", followup["account_id"], {
            "open_followups": open_followups,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    pod.records.create("operations_log", {
        "action": "complete_followup",
        "result": f"followup_id={data.followup_id}, account_id={followup.get('account_id')}",
        "actor": data.completed_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return CompleteFollowupOutput(status="success", followup_id=data.followup_id)
