from dataclasses import dataclass
from typing import Optional


@dataclass
class UpdateTicketRecordInput:
    ticket_id: str
    status: str
    approved_to_send: Optional[bool] = None
    assigned_to: Optional[str] = None
    human_notes: Optional[str] = None
    resolution_summary: Optional[str] = None
    resolution_reasoning: Optional[str] = None
    analysis_status: Optional[str] = None


@dataclass
class UpdateTicketRecordOutput:
    status: str
    ticket_id: str
    error: Optional[str] = None
