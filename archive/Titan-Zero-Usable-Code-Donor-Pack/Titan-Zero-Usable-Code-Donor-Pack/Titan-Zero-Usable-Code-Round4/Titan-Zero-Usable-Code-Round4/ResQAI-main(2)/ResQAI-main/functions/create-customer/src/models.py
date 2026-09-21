from typing import Optional
from pydantic import BaseModel


class CreateCustomerInput(BaseModel):
    name: str
    primary_phone: Optional[str] = None
    primary_email: Optional[str] = None
    customer_type: Optional[str] = None
    timezone: str = "UTC"
    communication_prefs: Optional[dict] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    created_by: Optional[str] = None


class CreateCustomerOutput(BaseModel):
    status: str
    customer_id: Optional[str] = None
    error: Optional[str] = None
