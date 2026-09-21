from typing import Optional
from pydantic import BaseModel, Field


class CreateReportInput(BaseModel):
    name: str = Field(description="Report display name.")
    description: Optional[str] = Field(default=None, description="Optional description of the report.")
    config: dict = Field(description="Report configuration dict (tables, metrics, filters, etc.).")
    is_public: bool = Field(default=False, description="Whether the report is publicly accessible.")
    created_by: Optional[str] = Field(default=None, description="User or system that created the report.")


class CreateReportOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    report_id: Optional[str] = Field(default=None, description="UUID of the created report.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")
