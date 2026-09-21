from typing import Optional
from pydantic import BaseModel


class CompleteFollowupInput(BaseModel):
    followup_id: str
    completed_by: str
    notes: Optional[str] = None


class CompleteFollowupOutput(BaseModel):
    status: str
    followup_id: str
    error: Optional[str] = None
