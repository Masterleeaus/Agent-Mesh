from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AccountHealthScanInput(BaseModel):
    today: Optional[date] = Field(default=None, description="Override 'now'. Defaults to system date.")
    lookback_days: int = Field(default=120, description="How many days back define 'recent engagement'.")
    write_back: bool = Field(
        default=True,
        description="If true, update accounts.health, health_score, open_followups, overdue_followups, open_disputes. Defaults true so the CRM Tracker app stays fresh.",
    )
    top_n_riskiest: int = Field(default=10, description="How many riskiest accounts to return.")
    relationship_overrides: dict[str, str] = Field(
        default_factory=dict,
        description="Map of account_id -> relationship_status to enforce (treat as authoritative for this scan only).",
    )


class AccountRiskSignal(BaseModel):
    label: Literal[
        "no_contact", "no_service", "high_overdue_followups",
        "open_dispute", "critical_dispute", "single_service_relationship",
        "stale_relationship_status"
    ]
    weight: float


class AccountHealthRow(BaseModel):
    account_id: str
    customer_id: str
    name: str
    relationship_status: str
    prior_health: str
    new_health: str
    prior_score: Optional[float] = None
    new_score: float
    score_delta: float
    open_followups: int
    overdue_followups: int
    open_disputes: int
    days_since_last_contact: Optional[int] = None
    days_since_last_service: Optional[int] = None
    signposts: list[AccountRiskSignal]
    summary: str


class AccountHealthScanResult(BaseModel):
    today: str
    scan_params: dict
    totals: dict
    by_health: dict
    top_risk: list[AccountHealthRow]
    all_rows: list[AccountHealthRow]
