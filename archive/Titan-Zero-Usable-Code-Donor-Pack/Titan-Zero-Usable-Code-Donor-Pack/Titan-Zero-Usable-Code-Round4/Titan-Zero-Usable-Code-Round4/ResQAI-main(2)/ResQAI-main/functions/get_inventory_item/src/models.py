from typing import Any, Optional
from pydantic import BaseModel, Field


class GetInventoryItemInput(BaseModel):
    record_id: str = Field(description="Inventory Item ID")
    actor_id: Optional[str] = Field(default=None, description="Actor user ID")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")


class GetInventoryItemOutput(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[Any] = Field(default=None, description="Response data")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
