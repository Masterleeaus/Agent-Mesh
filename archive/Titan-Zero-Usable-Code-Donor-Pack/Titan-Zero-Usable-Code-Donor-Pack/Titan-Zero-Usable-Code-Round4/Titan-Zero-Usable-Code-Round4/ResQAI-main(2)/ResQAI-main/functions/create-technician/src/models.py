from typing import Optional

from pydantic import BaseModel, Field


class CreateTechnicianInput(BaseModel):
    name: str = Field(description="Technician full name.")
    primary_phone: Optional[str] = Field(default=None, description="Primary phone number.")
    primary_email: Optional[str] = Field(default=None, description="Primary email address.")
    timezone: str = Field(default="UTC", description="Timezone of the technician.")
    certification: Optional[list] = Field(default=None, description="List of certifications or skills.")
    max_daily_jobs: int = Field(default=4, description="Maximum jobs per day.")
    notes: Optional[str] = Field(default=None, description="Optional notes.")
    created_by: Optional[str] = Field(default=None, description="Actor creating the technician.")


class CreateTechnicianOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    technician_id: Optional[str] = Field(default=None, description="The new technician UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
