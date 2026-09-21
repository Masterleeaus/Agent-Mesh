from typing import Optional
from pydantic import BaseModel, Field


class TicketSearchResult(BaseModel):
    ticket_id: str = Field(description="ID of the ticket.")
    customer_name: Optional[str] = Field(default=None, description="Name of the customer.")
    subject: str = Field(description="Subject of the ticket.")
    status: str = Field(description="Current status of the ticket.")
    urgency: str = Field(description="Urgency level of the ticket.")
    assigned_to: Optional[str] = Field(default=None, description="Currently assigned agent or technician.")
    created_at: str = Field(description="ISO 8601 timestamp when the ticket was created.")
    channel: Optional[str] = Field(default=None, description="Channel through which the ticket was submitted.")


class SearchTicketsInput(BaseModel):
    status: Optional[str] = Field(default=None, description="Filter by ticket status (new, classified, drafted, sent, approved_to_send, closed).")
    urgency: Optional[str] = Field(default=None, description="Filter by urgency level (low, normal, high, urgent).")
    assigned_to: Optional[str] = Field(default=None, description="Filter by assigned agent or technician.")
    customer_name: Optional[str] = Field(default=None, description="Filter by customer name (substring match).")
    channel: Optional[str] = Field(default=None, description="Filter by channel (email, phone, web, chat).")
    limit: int = Field(default=50, description="Maximum number of results to return.")
    offset: int = Field(default=0, description="Number of results to skip for pagination.")


class SearchTicketsOutput(BaseModel):
    total: int = Field(description="Total number of matching tickets.")
    results: list[TicketSearchResult] = Field(description="List of matching ticket results.")
