from typing import Optional
from pydantic import BaseModel


class ListDisputesInput(BaseModel):
    status: Optional[str] = None
    customer_id: Optional[str] = None
    appointment_id: Optional[str] = None
    ticket_id: Optional[str] = None
    limit: int = 100


class DisputeItem(BaseModel):
    dispute_id: str
    customer_id: Optional[str] = None
    appointment_id: Optional[str] = None
    ticket_id: Optional[str] = None
    status: str
    customer_claim: Optional[str] = None
    provider_claim: Optional[str] = None
    evidence_summary: Optional[str] = None
    recommended_resolution: Optional[str] = None
    confidence: Optional[float] = None
    created_at: Optional[str] = None


class ListDisputesOutput(BaseModel):
    total: int
    disputes: list[DisputeItem]
