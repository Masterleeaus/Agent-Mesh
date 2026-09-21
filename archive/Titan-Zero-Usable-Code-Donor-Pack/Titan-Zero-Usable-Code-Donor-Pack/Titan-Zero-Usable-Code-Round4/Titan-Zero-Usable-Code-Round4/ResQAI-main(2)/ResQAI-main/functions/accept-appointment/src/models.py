from typing import Optional

from pydantic import BaseModel, Field


class AcceptAppointmentInput(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment to accept.")
    technician_id: str = Field(description="UUID of the accepting technician.")
    technician_name: str = Field(description="Name of the accepting technician.")
    notes: Optional[str] = Field(default=None, description="Optional notes from the technician.")


class AcceptAppointmentOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    appointment_id: str = Field(description="The appointment UUID that was accepted.")
    technician_id: str = Field(description="The technician UUID who accepted.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
