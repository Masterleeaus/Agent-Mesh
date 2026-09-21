from dataclasses import dataclass
from typing import Optional


@dataclass
class CheckTicketUrgencyInput:
    ticket_id: str
    urgency: str
    classification_status: Optional[str] = None


@dataclass
class CheckTicketUrgencyOutput:
    routing: str
    ticket_id: str
    is_urgent: bool
