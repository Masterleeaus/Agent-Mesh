from typing import Optional
from pydantic import BaseModel


class SearchCustomersInput(BaseModel):
    query: Optional[str] = None
    status: Optional[str] = None
    customer_type: Optional[str] = None
    limit: int = 50


class CustomerSearchResult(BaseModel):
    customer_id: str
    name: str
    primary_email: Optional[str] = None
    primary_phone: Optional[str] = None
    status: Optional[str] = None
    customer_type: Optional[str] = None
    tags: list = []


class SearchCustomersOutput(BaseModel):
    total: int
    results: list[CustomerSearchResult]
