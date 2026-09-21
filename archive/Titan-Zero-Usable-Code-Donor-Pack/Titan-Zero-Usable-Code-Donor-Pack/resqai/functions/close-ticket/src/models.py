from typing import Optional
from pydantic import BaseModel, Field


class CloseTicketInput(BaseModel):
    ticket_id: str = Field(description="ID of the ticket to close.")
    resolution_summary: str = Field(description="Summary of how the issue was resolved.")
    resolution_reasoning: Optional[str] = Field(default=None, description="Detailed reasoning behind the resolution.")
    closed_by: str = Field(description="User or workflow that closed the ticket.")
    send_notification: bool = Field(default=False, description="Whether to send an email notification to the customer.")


class CloseTicketOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, already_closed, or error.")
    ticket_id: str = Field(description="Echoed ticket_id for workflow tracking.")
    error: Optional[str] = Field(default=None, description="Error detail if close failed.")
