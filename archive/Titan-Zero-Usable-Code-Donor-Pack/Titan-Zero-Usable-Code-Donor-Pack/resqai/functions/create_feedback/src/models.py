from typing import Any, Optional
from pydantic import BaseModel, Field


class CreateFeedbackInput(BaseModel):
    data: dict[str, Any] = Field(description="Feedback data")
    created_by: Optional[str] = Field(default=None, description="Creator user ID")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for safe retries")


class CreateFeedbackOutput(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[dict[str, Any]] = Field(default=None, description="Created record")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
