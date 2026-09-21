#input_type_name: EscalateTicketInput
#output_type_name: EscalateTicketOutput
#function_name: escalate_ticket

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from src.models import EscalateTicketInput, EscalateTicketOutput


async def escalate_ticket(ctx: FunctionContext, data: EscalateTicketInput) -> EscalateTicketOutput:
    pod = Pod.from_env()

    ticket = pod.records.get("tickets", data.ticket_id)
    if not ticket:
        return EscalateTicketOutput(
            status="not_found",
            ticket_id=data.ticket_id,
            error=f"Ticket {data.ticket_id} not found",
        )

    now = datetime.now(timezone.utc).isoformat()

    updates = {
        "escalated_at": now,
        "escalation_reason": data.escalation_reason,
        "urgency": data.target_urgency,
        "updated_at": now,
    }

    pod.records.update("tickets", data.ticket_id, updates)

    pod.records.create("operations_log", {
        "action": "ticket.escalated",
        "result": (
            f"ticket_id={data.ticket_id}, "
            f"reason={data.escalation_reason}, "
            f"urgency={data.target_urgency}, "
            f"by={data.escalated_by}"
        ),
        "actor": data.escalated_by,
    })

    pod.records.create("events", {
        "event_name": "ticket.escalated",
        "producer_app": "resqai-v2",
        "producer_entity_type": "ticket",
        "producer_entity_id": data.ticket_id,
        "payload": {
            "escalation_reason": data.escalation_reason,
            "target_urgency": data.target_urgency,
            "escalated_by": data.escalated_by,
        },
        "status": "processed",
        "created_at": now,
    })

    try:
        pod.connectors.execute(
            "resqai-discord",
            "chat_post_message",
            {
                "channel": "support-alerts",
                "text": (
                    f"🚨 **Ticket Escalated**\n"
                    f"**Ticket:** {data.ticket_id}\n"
                    f"**Reason:** {data.escalation_reason}\n"
                    f"**Urgency:** {data.target_urgency}\n"
                    f"**Escalated By:** {data.escalated_by}"
                ),
            },
        )
    except Exception:
        pass

    return EscalateTicketOutput(
        status="success",
        ticket_id=data.ticket_id,
    )
