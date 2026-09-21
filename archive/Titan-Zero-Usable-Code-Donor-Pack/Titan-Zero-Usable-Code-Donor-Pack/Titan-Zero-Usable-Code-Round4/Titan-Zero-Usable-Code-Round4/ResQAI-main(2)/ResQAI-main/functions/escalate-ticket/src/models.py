from typing import Optional
from pydantic import BaseModel, Field


class EscalateTicketInput(BaseModel):
    ticket_id: str = Field(description="ID of the ticket to escalate.")
    escalation_reason: str = Field(description="Reason for the escalation.")
    escalated_by: str = Field(description="User or workflow that escalated the ticket.")
    target_urgency: str = Field(default="urgent", description="Target urgency level after escalation (default: urgent).")


class EscalateTicketOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    ticket_id: str = Field(description="Echoed ticket_id for workflow tracking.")
    error: Optional[str] = Field(default=None, description="Error detail if escalation failed.")
