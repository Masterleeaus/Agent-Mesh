#input_type_name: UpdateTicketV2Input
#output_type_name: UpdateTicketV2Output
#function_name: update_ticket_v2

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from src.models import UpdateTicketV2Input, UpdateTicketV2Output


async def update_ticket_v2(ctx: FunctionContext, data: UpdateTicketV2Input) -> UpdateTicketV2Output:
    pod = Pod.from_env()

    ticket = pod.records.get("tickets", data.ticket_id)
    if not ticket:
        return UpdateTicketV2Output(
            status="not_found",
            ticket_id=data.ticket_id,
            error=f"Ticket {data.ticket_id} not found",
        )

    now = datetime.now(timezone.utc).isoformat()

    updates = {"updated_at": now}
    for field in ("status", "assigned_to", "human_notes", "draft_reply", "resolution_summary"):
        value = getattr(data, field, None)
        if value is not None:
            updates[field] = value

    if data.approved_to_send is not None:
        updates["approved_to_send"] = data.approved_to_send

    if data.updated_by is not None:
        updates["updated_by"] = data.updated_by

    if data.status == "closed":
        updates["closed_at"] = now

    pod.records.update("tickets", data.ticket_id, updates)

    pod.records.create("operations_log", {
        "action": "ticket.updated",
        "result": f"ticket_id={data.ticket_id}, fields={','.join(updates.keys())}",
        "actor": data.updated_by or "system",
    })

    pod.records.create("events", {
        "event_name": "ticket.updated",
        "producer_app": "resqai-v2",
        "producer_entity_type": "ticket",
        "producer_entity_id": data.ticket_id,
        "payload": {
            "updated_fields": list(updates.keys()),
            "new_status": data.status,
        },
        "status": "processed",
        "created_at": now,
    })

    return UpdateTicketV2Output(
        status="success",
        ticket_id=data.ticket_id,
    )
