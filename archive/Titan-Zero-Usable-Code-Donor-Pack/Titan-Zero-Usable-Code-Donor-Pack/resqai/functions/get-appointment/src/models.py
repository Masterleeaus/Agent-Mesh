from typing import Optional

from pydantic import BaseModel, Field


class AppointmentDetail(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment.")
    customer_id: Optional[str] = Field(default=None, description="UUID of the customer.")
    customer_name: Optional[str] = Field(default=None, description="Name of the customer.")
    technician_id: Optional[str] = Field(default=None, description="UUID of the assigned technician.")
    technician_name: Optional[str] = Field(default=None, description="Name of the assigned technician.")
    service_type: Optional[str] = Field(default=None, description="Type of service.")
    scheduled_date: Optional[str] = Field(default=None, description="ISO 8601 scheduled datetime.")
    status: Optional[str] = Field(default=None, description="Current status.")
    duration_minutes: Optional[int] = Field(default=None, description="Duration in minutes.")
    notes: Optional[str] = Field(default=None, description="Notes on the appointment.")
    work_summary: Optional[str] = Field(default=None, description="Summary of completed work.")
    completed_at: Optional[str] = Field(default=None, description="ISO 8601 completion datetime.")
    cancelled_at: Optional[str] = Field(default=None, description="ISO 8601 cancellation datetime.")
    cancellation_reason: Optional[str] = Field(default=None, description="Reason for cancellation.")
    customer_signature: Optional[str] = Field(default=None, description="Customer signature reference.")
    created_by: Optional[str] = Field(default=None, description="Actor who created the appointment.")
    created_at: Optional[str] = Field(default=None, description="ISO 8601 creation datetime.")


class GetAppointmentInput(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment to retrieve.")


class GetAppointmentOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    appointment: Optional[AppointmentDetail] = Field(default=None, description="The appointment details, if found.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
