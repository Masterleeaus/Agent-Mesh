#input_type_name: CloseTicketInput
#output_type_name: CloseTicketOutput
#function_name: close_ticket

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from src.models import CloseTicketInput, CloseTicketOutput


async def close_ticket(ctx: FunctionContext, data: CloseTicketInput) -> CloseTicketOutput:
    pod = Pod.from_env()

    ticket = pod.records.get("tickets", data.ticket_id)
    if not ticket:
        return CloseTicketOutput(
            status="not_found",
            ticket_id=data.ticket_id,
            error=f"Ticket {data.ticket_id} not found",
        )

    if ticket.get("status") == "closed":
        return CloseTicketOutput(
            status="already_closed",
            ticket_id=data.ticket_id,
            error=f"Ticket {data.ticket_id} is already closed",
        )

    now = datetime.now(timezone.utc).isoformat()

    updates = {
        "status": "closed",
        "closed_at": now,
        "resolution_summary": data.resolution_summary,
        "updated_at": now,
    }
    if data.resolution_reasoning:
        updates["resolution_reasoning"] = data.resolution_reasoning
    updates["updated_by"] = data.closed_by

    pod.records.update("tickets", data.ticket_id, updates)

    pod.records.create("operations_log", {
        "action": "ticket.closed",
        "result": f"ticket_id={data.ticket_id}, resolution={data.resolution_summary}",
        "actor": data.closed_by,
    })

    pod.records.create("events", {
        "event_name": "ticket.closed",
        "producer_app": "resqai-v2",
        "producer_entity_type": "ticket",
        "producer_entity_id": data.ticket_id,
        "payload": {
            "resolution_summary": data.resolution_summary,
            "closed_by": data.closed_by,
        },
        "status": "processed",
        "created_at": now,
    })

    if data.send_notification:
        customer = pod.records.get("customers", ticket.get("customer_id"))
        if customer and customer.get("email"):
            try:
                pod.connectors.execute(
                    "resqai-gmail",
                    "gmail_send_email",
                    {
                        "recipient_email": customer["email"],
                        "subject": f"Re: {ticket.get('subject', 'Your Support Request')}",
                        "body": (
                            f"Your ticket ({data.ticket_id}) has been resolved.\n\n"
                            f"{data.resolution_summary}\n\n"
                            f"Thank you for your patience."
                        ),
                    },
                )
            except Exception:
                pass

    return CloseTicketOutput(
        status="success",
        ticket_id=data.ticket_id,
    )
