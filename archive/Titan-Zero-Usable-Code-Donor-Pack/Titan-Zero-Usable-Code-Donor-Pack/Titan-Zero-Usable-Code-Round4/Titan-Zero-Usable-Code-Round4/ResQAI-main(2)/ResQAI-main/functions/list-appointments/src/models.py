from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class AppointmentItem(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment.")
    customer_id: str = Field(description="UUID of the customer.")
    customer_name: Optional[str] = Field(default=None, description="Name of the customer.")
    technician_id: Optional[str] = Field(default=None, description="UUID of the assigned technician.")
    technician_name: Optional[str] = Field(default=None, description="Name of the assigned technician.")
    service_type: str = Field(description="Type of service.")
    scheduled_date: str = Field(description="ISO 8601 scheduled datetime.")
    status: str = Field(description="Current status of the appointment.")
    duration_minutes: int = Field(default=60, description="Duration in minutes.")
    notes: Optional[str] = Field(default=None, description="Notes on the appointment.")


class ListAppointmentsInput(BaseModel):
    status: Optional[str] = Field(default=None, description="Filter by status.")
    technician_id: Optional[str] = Field(default=None, description="Filter by technician UUID.")
    customer_id: Optional[str] = Field(default=None, description="Filter by customer UUID.")
    scheduled_date_from: Optional[date] = Field(default=None, description="Filter by scheduled date start (inclusive).")
    scheduled_date_to: Optional[date] = Field(default=None, description="Filter by scheduled date end (inclusive).")
    limit: int = Field(default=100, description="Maximum number of results to return.")


class ListAppointmentsOutput(BaseModel):
    total: int = Field(description="Total number of matching appointments.")
    appointments: list[AppointmentItem] = Field(description="List of matching appointments.")
