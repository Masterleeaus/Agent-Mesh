#input_type_name: CreateTicketInput
#output_type_name: CreateTicketOutput
#function_name: create_ticket

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from src.models import CreateTicketInput, CreateTicketOutput


async def create_ticket(ctx: FunctionContext, data: CreateTicketInput) -> CreateTicketOutput:
    pod = Pod.from_env()

    missing = [f for f in ("customer_id", "channel", "subject", "message") if not getattr(data, f)]
    if missing:
        return CreateTicketOutput(
            status="error",
            error=f"Missing required fields: {', '.join(missing)}",
        )

    now = datetime.now(timezone.utc).isoformat()

    created = pod.records.create("tickets", {
        "customer_id": data.customer_id,
        "customer_name": data.customer_name or "",
        "channel": data.channel,
        "subject": data.subject,
        "message": data.message,
        "request_type": data.request_type or "",
        "urgency": data.urgency,
        "status": "new",
        "created_by": data.created_by or "",
        "created_at": now,
        "updated_at": now,
    })

    ticket_id = created.get("id", "")

    pod.records.create("operations_log", {
        "action": "ticket.created",
        "result": f"ticket_id={ticket_id}, channel={data.channel}, urgency={data.urgency}",
        "actor": data.created_by or "system",
    })

    pod.records.create("events", {
        "event_name": "ticket.created",
        "producer_app": "resqai-v2",
        "producer_entity_type": "ticket",
        "producer_entity_id": ticket_id,
        "payload": {
            "customer_id": data.customer_id,
            "channel": data.channel,
            "urgency": data.urgency,
        },
        "status": "processed",
        "created_at": now,
    })

    return CreateTicketOutput(
        status="success",
        ticket_id=ticket_id,
    )
