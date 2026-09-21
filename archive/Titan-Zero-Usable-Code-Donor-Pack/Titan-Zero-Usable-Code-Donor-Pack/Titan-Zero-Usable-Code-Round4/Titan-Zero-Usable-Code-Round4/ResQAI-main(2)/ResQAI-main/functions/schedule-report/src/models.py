from typing import Literal, Optional
from pydantic import BaseModel, Field


class ScheduleReportInput(BaseModel):
    report_id: str = Field(description="UUID of the report to schedule.")
    frequency: Literal["daily", "weekly", "monthly"] = Field(description="Delivery frequency.")
    recipients: list[str] = Field(description="List of recipient email addresses.")
    format: str = Field(default="pdf", description="Output format (pdf, csv, xlsx).")
    is_active: bool = Field(default=True, description="Whether the schedule is active on creation.")


class ScheduleReportOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    schedule_id: Optional[str] = Field(default=None, description="UUID of the created schedule.")
    error: Optional[str] = Field(default=None, description="Error detail if scheduling failed.")
