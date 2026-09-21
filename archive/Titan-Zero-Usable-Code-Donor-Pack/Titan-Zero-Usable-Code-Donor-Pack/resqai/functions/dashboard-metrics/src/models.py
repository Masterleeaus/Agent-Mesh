from typing import Optional
from pydantic import BaseModel, Field


class DashboardMetricsInput(BaseModel):
    include_trends: bool = Field(default=False, description="Whether to include trend computations.")


class DashboardMetricsOutput(BaseModel):
    tickets_summary: dict = Field(description="Summary of ticket counts by status and urgency.")
    appointments_summary: dict = Field(description="Summary of appointment counts by status.")
    technician_summary: dict = Field(description="Summary of technician workload and availability.")
    account_health_summary: dict = Field(description="Summary of account health scores.")
    followup_summary: dict = Field(description="Summary of pending and overdue follow-ups.")
    trends: Optional[dict] = Field(default=None, description="Trend data over time if requested.")