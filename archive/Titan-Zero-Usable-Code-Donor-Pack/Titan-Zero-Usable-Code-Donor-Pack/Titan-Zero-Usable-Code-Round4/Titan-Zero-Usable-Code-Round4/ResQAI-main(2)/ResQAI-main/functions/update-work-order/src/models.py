from typing import Optional
from pydantic import BaseModel, Field


class UpdateWorkOrderInput(BaseModel):
    work_order_id: str = Field(description="The work order UUID to update.")
    status: Optional[str] = Field(default=None, description="New status for the work order.")
    technician_notes: Optional[str] = Field(default=None, description="Notes from the technician.")
    parts_used: Optional[list[dict]] = Field(default=None, description="List of parts used with part_id and quantity.")
    photos: Optional[list[str]] = Field(default=None, description="List of photo attachment URLs.")
    signature_ref: Optional[str] = Field(default=None, description="Signature reference or URL.")
    updated_by: Optional[str] = Field(default=None, description="Actor updating the work order.")


class UpdateWorkOrderOutput(BaseModel):
    status: str = Field(description="Operation result status: success, not_found, or error.")
    work_order_id: str = Field(description="The updated work order UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if update failed.")