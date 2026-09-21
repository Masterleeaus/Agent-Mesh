from typing import Optional
from pydantic import BaseModel, Field


class CreateTicketInput(BaseModel):
    customer_id: str = Field(description="ID of the customer creating the ticket.")
    customer_name: Optional[str] = Field(default=None, description="Display name of the customer.")
    channel: str = Field(description="Channel through which the ticket was submitted (email, phone, web, chat).")
    subject: str = Field(description="Short summary of the issue.")
    message: str = Field(description="Full description of the issue.")
    request_type: Optional[str] = Field(default=None, description="Type of request (new_booking, complaint, billing, etc.).")
    urgency: str = Field(default="normal", description="Urgency level: low, normal, high, urgent.")
    created_by: Optional[str] = Field(default=None, description="User or workflow that created the ticket.")


class CreateTicketOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    ticket_id: Optional[str] = Field(default=None, description="ID of the newly created ticket.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")
