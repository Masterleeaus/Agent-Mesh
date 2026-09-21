from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateAppointmentInput(BaseModel):
    customer_id: str = Field(description="UUID of the customer.")
    service_type: str = Field(description="Type of service requested.")
    scheduled_date: str = Field(description="ISO 8601 datetime for the appointment.")
    duration_minutes: int = Field(default=60, description="Duration in minutes.")
    notes: Optional[str] = Field(default=None, description="Optional notes.")
    created_by: Optional[str] = Field(default=None, description="Actor who created the appointment.")


class CreateAppointmentOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    appointment_id: Optional[str] = Field(default=None, description="The new appointment UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
