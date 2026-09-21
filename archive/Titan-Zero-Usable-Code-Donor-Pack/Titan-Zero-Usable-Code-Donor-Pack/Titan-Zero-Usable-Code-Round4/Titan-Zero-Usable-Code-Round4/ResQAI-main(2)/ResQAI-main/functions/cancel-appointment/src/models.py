from typing import Optional

from pydantic import BaseModel, Field


class CancelAppointmentInput(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment to cancel.")
    cancellation_reason: str = Field(description="Reason for cancellation.")
    cancelled_by: str = Field(description="Actor cancelling the appointment.")


class CancelAppointmentOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    appointment_id: str = Field(description="The appointment UUID that was cancelled.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
