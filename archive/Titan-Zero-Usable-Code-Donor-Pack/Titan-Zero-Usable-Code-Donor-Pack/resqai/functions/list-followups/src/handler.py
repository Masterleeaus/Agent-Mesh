#input_type_name: ListFollowupsInput
#output_type_name: ListFollowupsOutput
#function_name: list_followups

from lemma_sdk import FunctionContext, Pod
from src.models import ListFollowupsInput, ListFollowupsOutput, FollowupItem


async def list_followups(ctx: FunctionContext, data: ListFollowupsInput) -> ListFollowupsOutput:
    pod = Pod.from_env()

    filters = {}
    if data.account_id:
        filters["account_id"] = data.account_id
    if data.customer_id:
        filters["customer_id"] = data.customer_id
    if data.status:
        filters["status"] = data.status
    if data.assigned_to:
        filters["assigned_to"] = data.assigned_to

    all_followups = pod.records.query("followups", filters)

    if data.due_date_from:
        all_followups = [
            f for f in all_followups
            if (f.get("due_date") or "") >= data.due_date_from
        ]
    if data.due_date_to:
        all_followups = [
            f for f in all_followups
            if (f.get("due_date") or "") <= data.due_date_to
        ]

    results = all_followups[:data.limit]

    return ListFollowupsOutput(
        total=len(all_followups),
        followups=[
            FollowupItem(
                followup_id=f.get("id"),
                account_id=f.get("account_id", ""),
                customer_id=f.get("customer_id"),
                type=f.get("type", ""),
                subject=f.get("subject", ""),
                status=f.get("status", ""),
                priority=f.get("priority", "normal"),
                due_date=f.get("due_date"),
                assigned_to=f.get("assigned_to"),
                related_ticket_id=f.get("related_ticket_id"),
                related_appointment_id=f.get("related_appointment_id"),
                notes=f.get("notes"),
            )
            for f in results
        ],
    )
