from typing import Optional
from src.models import CheckTicketUrgencyInput, CheckTicketUrgencyOutput


def handle(input_data: CheckTicketUrgencyInput) -> CheckTicketUrgencyOutput:
    urgency = input_data.urgency
    is_urgent = urgency in ("high", "urgent")
    return CheckTicketUrgencyOutput(
        routing=urgency,
        ticket_id=input_data.ticket_id,
        is_urgent=is_urgent,
    )
