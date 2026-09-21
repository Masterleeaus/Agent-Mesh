from typing import Optional

from pydantic import BaseModel, Field


class UpdateTechnicianSkillsInput(BaseModel):
    technician_id: str = Field(description="UUID of the technician to update.")
    skills: list[str] = Field(description="List of skills or certifications to set.")


class UpdateTechnicianSkillsOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    technician_id: str = Field(description="The technician UUID that was updated.")
    skills: list[str] = Field(description="The updated list of skills.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")
