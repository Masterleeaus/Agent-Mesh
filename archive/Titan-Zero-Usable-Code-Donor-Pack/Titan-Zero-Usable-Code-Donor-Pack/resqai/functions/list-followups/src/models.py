from typing import Optional
from pydantic import BaseModel


class ListFollowupsInput(BaseModel):
    account_id: Optional[str] = None
    customer_id: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date_from: Optional[str] = None
    due_date_to: Optional[str] = None
    limit: int = 100


class FollowupItem(BaseModel):
    followup_id: str
    account_id: str
    customer_id: Optional[str] = None
    type: str
    subject: str
    status: str
    priority: str
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    related_ticket_id: Optional[str] = None
    related_appointment_id: Optional[str] = None
    notes: Optional[str] = None


class ListFollowupsOutput(BaseModel):
    total: int
    followups: list[FollowupItem]
