from typing import Optional
from pydantic import BaseModel, Field


class UpdateTicketV2Input(BaseModel):
    ticket_id: str = Field(description="ID of the ticket to update.")
    status: Optional[str] = Field(default=None, description="New status value (new, classified, drafted, sent, approved_to_send, closed).")
    assigned_to: Optional[str] = Field(default=None, description="Technician or agent to assign.")
    human_notes: Optional[str] = Field(default=None, description="Internal notes from human review.")
    draft_reply: Optional[str] = Field(default=None, description="Draft reply to send to customer.")
    approved_to_send: Optional[bool] = Field(default=None, description="Whether the draft is approved to be sent.")
    resolution_summary: Optional[str] = Field(default=None, description="Summary of how the ticket was resolved.")
    updated_by: Optional[str] = Field(default=None, description="User or workflow that performed the update.")


class UpdateTicketV2Output(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    ticket_id: str = Field(description="Echoed ticket_id for workflow tracking.")
    error: Optional[str] = Field(default=None, description="Error detail if update failed.")
