from typing import Optional
from pydantic import BaseModel, Field
from datetime import date


class AggregatedMetrics(BaseModel):
    total_tickets: int = Field(description="Total number of tickets.")
    open_tickets: int = Field(description="Number of open tickets.")
    closed_tickets: int = Field(description="Number of closed tickets.")
    avg_resolution_time_hours: float = Field(description="Average resolution time in hours.")
    total_appointments: int = Field(description="Total number of appointments.")
    completed_appointments: int = Field(description="Number of completed appointments.")
    cancelled_appointments: int = Field(description="Number of cancelled appointments.")
    total_customers: int = Field(description="Total number of customers.")
    total_technicians: int = Field(description="Total number of technicians.")
    tickets_by_status: dict = Field(description="Tickets grouped by status.")
    tickets_by_urgency: dict = Field(description="Tickets grouped by urgency.")


class AnalyticsAggregationInput(BaseModel):
    period: str = Field(description="Aggregation period: daily, weekly, or monthly.")
    date_from: date = Field(description="Start date for aggregation (inclusive).")
    date_to: Optional[date] = Field(default=None, description="End date for aggregation (inclusive). Defaults to date_from.")


class AnalyticsAggregationOutput(BaseModel):
    period: str = Field(description="The aggregation period used.")
    date_from: date = Field(description="Start date of the aggregation range.")
    date_to: date = Field(description="End date of the aggregation range.")
    metrics: AggregatedMetrics = Field(description="Computed aggregate metrics.")