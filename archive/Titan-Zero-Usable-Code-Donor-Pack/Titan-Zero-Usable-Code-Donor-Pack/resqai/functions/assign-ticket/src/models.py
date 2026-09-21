from typing import Optional
from pydantic import BaseModel, Field


class AssignTicketInput(BaseModel):
    ticket_id: str = Field(description="ID of the ticket to assign.")
    assigned_to: str = Field(description="Technician or agent to assign the ticket to.")
    assigned_by: str = Field(description="User or workflow that performed the assignment.")
    assignment_note: Optional[str] = Field(default=None, description="Optional note explaining the assignment.")


class AssignTicketOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    ticket_id: str = Field(description="Echoed ticket_id for workflow tracking.")
    assigned_to: str = Field(description="The assignee.")
    error: Optional[str] = Field(default=None, description="Error detail if assignment failed.")
