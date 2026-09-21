from typing import Optional
from pydantic import BaseModel


class UpdateCustomerInput(BaseModel):
    customer_id: str
    name: Optional[str] = None
    primary_phone: Optional[str] = None
    primary_email: Optional[str] = None
    status: Optional[str] = None
    customer_type: Optional[str] = None
    timezone: Optional[str] = None
    communication_prefs: Optional[dict] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    updated_by: Optional[str] = None


class UpdateCustomerOutput(BaseModel):
    status: str
    customer_id: str
    error: Optional[str] = None
