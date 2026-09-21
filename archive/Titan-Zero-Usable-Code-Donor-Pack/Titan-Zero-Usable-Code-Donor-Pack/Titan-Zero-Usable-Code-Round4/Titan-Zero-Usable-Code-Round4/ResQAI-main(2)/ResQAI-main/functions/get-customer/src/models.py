from typing import Optional
from pydantic import BaseModel


class GetCustomerInput(BaseModel):
    customer_id: str
    include_account: bool = False


class GetCustomerOutput(BaseModel):
    status: str
    customer: Optional[dict] = None
    account: Optional[dict] = None
    error: Optional[str] = None
