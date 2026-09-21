from typing import Optional

from pydantic import BaseModel, Field


class UpdateTechnicianInput(BaseModel):
    technician_id: str = Field(description="UUID of the technician to update.")
    name: Optional[str] = Field(default=None, description="Updated full name.")
    primary_phone: Optional[str] = Field(default=None, description="Updated primary phone.")
    primary_email: Optional[str] = Field(default=None, description="Updated primary email.")
    status: Optional[str] = Field(default=None, description="Updated status.")
    notes: Optional[str] = Field(default=None, description="Updated notes.")
    max_daily_jobs: Optional[int] = Field(default=None, description="Updated max daily jobs.")
    updated_by: Optional[str] = Field(default=None, description="Actor performing the update.")


class UpdateTechnicianOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    technician_id: str = Field(description="The technician UUID that was updated.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
