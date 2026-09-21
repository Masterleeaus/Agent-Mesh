from typing import Any, Optional
from pydantic import BaseModel, Field


class ListFeedbackInput(BaseModel):
    filters: Optional[dict[str, Any]] = Field(default=None, description="Filter conditions")
    sort_by: Optional[str] = Field(default=None, description="Sort field")
    sort_dir: str = Field(default="desc", description="Sort direction: asc or desc")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=200, description="Items per page")
    search: Optional[str] = Field(default=None, description="Search query")
    search_fields: Optional[list[str]] = Field(default=None, description="Fields to search in")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")


class ListFeedbackOutput(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[list[dict[str, Any]]] = Field(default=None, description="List of records")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    pagination: Optional[dict[str, Any]] = Field(default=None, description="Pagination info")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
