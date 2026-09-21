from typing import Optional, Literal
from pydantic import BaseModel


class UpdateAccountHealthInput(BaseModel):
    account_id: str
    health_score: float
    health: Literal["healthy", "watch", "slipping", "critical"]
    scan_notes: Optional[str] = None
    triggered_by: Optional[str] = None


class UpdateAccountHealthOutput(BaseModel):
    status: str
    account_id: str
    health_before: str
    health_after: str
    error: Optional[str] = None
