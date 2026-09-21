from typing import Optional
from pydantic import BaseModel, Field


class ExecuteReportInput(BaseModel):
    report_id: str = Field(description="UUID of the report to execute.")
    params: Optional[dict] = Field(default=None, description="Override parameters for report execution (date range, filters, etc.).")


class ExecuteReportOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    report_id: str = Field(description="Echoed report_id.")
    data: dict = Field(description="Aggregated report data keyed by metric or table.")
    generated_at: str = Field(description="ISO timestamp when the report was generated.")
    error: Optional[str] = Field(default=None, description="Error detail if execution failed.")
