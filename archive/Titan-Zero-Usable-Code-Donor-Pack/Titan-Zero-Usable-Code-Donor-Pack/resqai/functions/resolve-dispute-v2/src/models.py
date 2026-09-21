from typing import Optional, Literal
from pydantic import BaseModel


class ResolveDisputeV2Input(BaseModel):
    dispute_id: str
    resolution_type: Literal["full_refund", "partial_refund", "redo_service", "discount_credit", "no_action", "escalate_legal"]
    resolution_notes: Optional[str] = None
    resolved_by: str
    notify_customer: bool = False


class ResolveDisputeV2Output(BaseModel):
    status: str
    dispute_id: str
    resolution_type: str
    error: Optional[str] = None
