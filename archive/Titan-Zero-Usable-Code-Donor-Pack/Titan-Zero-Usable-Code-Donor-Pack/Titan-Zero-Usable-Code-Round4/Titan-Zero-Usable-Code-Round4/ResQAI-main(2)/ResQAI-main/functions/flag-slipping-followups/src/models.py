from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class FlagSlippingFollowupsInput(BaseModel):
    today: Optional[date] = Field(
        default=None,
        description="Override 'now'. Defaults to system date.",
    )
    days_ahead: int = Field(
        default=7,
        description="Days from `today` to consider 'due soon' (not slipping yet).",
    )
    include_statuses: list[str] = Field(
        default_factory=lambda: ["pending", "in_progress"],
        description="Statuses that are still 'open'. Completed/missed/cancelled are excluded.",
    )
    top_n: int = Field(default=20, description="Cap result size for UI lists.")


class SlippingFollowup(BaseModel):
    followup_id: str
    account_id: str
    customer_id: str
    customer_name: str
    subject: str
    type: str
    status: str
    priority: str
    due_date: str
    days_overdue: int
    severity: Literal["critical", "high", "medium", "low"]
    bucket: Literal["overdue", "due_today", "due_soon"]
    owner: Optional[str] = None
    related_appointment_id: Optional[str] = None
    related_ticket_id: Optional[str] = None
    notes: Optional[str] = None


class FlagSlippingFollowupsResult(BaseModel):
    today: str
    window: dict
    counts: dict
    top: list[SlippingFollowup]
