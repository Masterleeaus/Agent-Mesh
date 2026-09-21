from typing import Optional
from pydantic import BaseModel


class CreateFollowupInput(BaseModel):
    account_id: str
    customer_id: Optional[str] = None
    type: str
    subject: str
    priority: str = "normal"
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    related_ticket_id: Optional[str] = None
    related_appointment_id: Optional[str] = None
    related_dispute_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class CreateFollowupOutput(BaseModel):
    status: str
    followup_id: Optional[str] = None
    error: Optional[str] = None
