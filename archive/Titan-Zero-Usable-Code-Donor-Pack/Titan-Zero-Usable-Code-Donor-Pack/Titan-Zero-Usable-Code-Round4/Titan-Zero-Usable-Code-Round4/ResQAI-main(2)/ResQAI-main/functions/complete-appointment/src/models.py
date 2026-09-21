from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PartUsed(BaseModel):
    part_name: str = Field(description="Name of the part used.")
    quantity: int = Field(description="Quantity used.")
    part_number: Optional[str] = Field(default=None, description="Part number or SKU.")


class CompleteAppointmentInput(BaseModel):
    appointment_id: str = Field(description="UUID of the appointment to complete.")
    completed_by: str = Field(description="Actor completing the appointment.")
    work_summary: Optional[str] = Field(default=None, description="Summary of work performed.")
    parts_used: Optional[list[PartUsed]] = Field(default=None, description="Parts used during service.")
    customer_signature: Optional[str] = Field(default=None, description="Base64-encoded customer signature or reference.")


class CompleteAppointmentOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    appointment_id: str = Field(description="The appointment UUID that was completed.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
