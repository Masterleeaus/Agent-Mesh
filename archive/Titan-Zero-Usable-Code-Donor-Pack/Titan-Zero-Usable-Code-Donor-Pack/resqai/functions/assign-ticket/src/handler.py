#input_type_name: AssignTicketInput
#output_type_name: AssignTicketOutput
#function_name: assign_ticket

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from src.models import AssignTicketInput, AssignTicketOutput


async def assign_ticket(ctx: FunctionContext, data: AssignTicketInput) -> AssignTicketOutput:
    pod = Pod.from_env()

    ticket = pod.records.get("tickets", data.ticket_id)
    if not ticket:
        return AssignTicketOutput(
            status="not_found",
            ticket_id=data.ticket_id,
            assigned_to=data.assigned_to,
            error=f"Ticket {data.ticket_id} not found",
        )

    now = datetime.now(timezone.utc).isoformat()
    previous_assignee = ticket.get("assigned_to")

    updates = {
        "assigned_to": data.assigned_to,
        "updated_at": now,
    }
    if data.assignment_note:
        updates["human_notes"] = (
            f"[{now}] Reassigned from {previous_assignee or 'unassigned'} "
            f"to {data.assigned_to} by {data.assigned_by}: {data.assignment_note}"
        )

    pod.records.update("tickets", data.ticket_id, updates)

    action = "ticket.reassigned" if previous_assignee else "ticket.assigned"
    pod.records.create("operations_log", {
        "action": action,
        "result": (
            f"ticket_id={data.ticket_id}, "
            f"from={previous_assignee or 'unassigned'}, "
            f"to={data.assigned_to}, "
            f"by={data.assigned_by}"
        ),
        "actor": data.assigned_by,
    })

    pod.records.create("events", {
        "event_name": "ticket.assigned",
        "producer_app": "resqai-v2",
        "producer_entity_type": "ticket",
        "producer_entity_id": data.ticket_id,
        "payload": {
            "previous_assignee": previous_assignee,
            "new_assignee": data.assigned_to,
            "assigned_by": data.assigned_by,
        },
        "status": "processed",
        "created_at": now,
    })

    return AssignTicketOutput(
        status="success",
        ticket_id=data.ticket_id,
        assigned_to=data.assigned_to,
    )
