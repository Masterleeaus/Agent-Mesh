from src.models import UpdateTicketRecordInput, UpdateTicketRecordOutput


def handle(input_data: UpdateTicketRecordInput) -> UpdateTicketRecordOutput:
    from lemma_sdk import Pod

    pod = Pod.from_env()

    ticket = pod.records.get("tickets", input_data.ticket_id)
    if not ticket:
        return UpdateTicketRecordOutput(
            status="not_found",
            ticket_id=input_data.ticket_id,
            error=f"Ticket {input_data.ticket_id} not found",
        )

    updates = {
        "status": input_data.status,
        "approved_to_send": input_data.approved_to_send,
    }

    if input_data.assigned_to:
        updates["owner"] = input_data.assigned_to
    if input_data.human_notes:
        updates["human_notes"] = input_data.human_notes

    pod.records.update("tickets", input_data.ticket_id, updates)

    pod.records.create("operations_log", {
        "action": "ticket-intake workflow complete",
        "result": f"status={input_data.status}, assigned_to={input_data.assigned_to or 'unassigned'}",
        "actor": "workflow:ticket-intake",
    })

    if input_data.approved_to_send and input_data.status == "approved_to_send":
        customer = pod.records.get("customers", ticket.get("customer_name"))
        if customer and customer.get("email"):
            try:
                pod.connectors.execute(
                    "resqai-gmail",
                    "gmail_send_email",
                    {
                        "recipient_email": customer["email"],
                        "subject": f"Re: {ticket.get('subject', 'Your Support Request')}",
                        "body": ticket.get("draft_reply", input_data.resolution_summary or "Your request has been processed."),
                    },
                )
                pod.records.create("operations_log", {
                    "action": "email notification sent via Gmail",
                    "result": f"ticket_id={input_data.ticket_id}, customer={customer.get('email')}",
                    "actor": "workflow:ticket-intake",
                })
            except Exception as e:
                pod.records.create("operations_log", {
                    "action": "email notification FAILED",
                    "result": f"ticket_id={input_data.ticket_id}, error={str(e)}",
                    "actor": "workflow:ticket-intake",
                })

    return UpdateTicketRecordOutput(
        status="success",
        ticket_id=input_data.ticket_id,
    )
