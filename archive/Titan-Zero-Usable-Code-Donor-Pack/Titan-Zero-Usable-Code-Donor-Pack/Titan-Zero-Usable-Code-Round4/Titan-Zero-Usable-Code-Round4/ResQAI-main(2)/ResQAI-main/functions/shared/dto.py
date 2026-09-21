import re
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SortDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=200, description="Items per page (max 200)")


class SortParams(BaseModel):
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_dir: SortDirection = Field(default=SortDirection.DESC, description="Sort direction")


class FilterParam(BaseModel):
    field: str = Field(description="Field name to filter on")
    operator: str = Field(default="eq", description="Filter operator: eq, neq, gt, gte, lt, lte, contains, in, between, is_null")
    value: Any = Field(default=None, description="Filter value")


class SearchParams(BaseModel):
    query: Optional[str] = Field(default=None, description="Search query string")
    search_fields: Optional[list[str]] = Field(default=None, description="Fields to search in")


class QueryParams(BaseModel):
    pagination: PaginationParams = Field(default_factory=PaginationParams)
    sort: SortParams = Field(default_factory=SortParams)
    filters: list[FilterParam] = Field(default_factory=list)
    search: SearchParams = Field(default_factory=SearchParams)


class Page(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)
    total_pages: int = Field(default=0)

    @model_validator(mode="after")
    def compute_total_pages(self) -> "Page":
        if self.total_pages == 0 and self.page_size > 0:
            self.total_pages = max(1, -(-self.total // self.page_size))
        return self


class ResponseWrapper(BaseModel):
    status: str = Field(default="success")
    data: Optional[Any] = None
    error: Optional[dict[str, Any]] = None
    pagination: Optional[Page] = None
    meta: Optional[dict[str, Any]] = None
    correlation_id: Optional[str] = None


class IdempotentRequest(BaseModel):
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for safe retries", max_length=256)


class SoftDeleteMixin(BaseModel):
    deleted_at: Optional[str] = None


class VersionedMixin(BaseModel):
    version: int = Field(default=1, ge=1, description="Optimistic locking version")


class TimestampMixin(BaseModel):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


def parse_uuid(value: str, field_name: str = "id") -> str:
    try:
        UUID(value)
        return value
    except ValueError:
        raise ValueError(f"Invalid UUID for {field_name}: {value}")


def validate_enum(value: str, valid_values: list[str], field_name: str) -> str:
    if value not in valid_values:
        raise ValueError(f"Invalid {field_name}: '{value}'. Must be one of: {', '.join(valid_values)}")
    return value


def validate_phone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = re.sub(r"[^\d+]", "", value)
    if len(cleaned) < 7 or len(cleaned) > 20:
        raise ValueError(f"Invalid phone number: {value}")
    return cleaned


def validate_email(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, value):
        raise ValueError(f"Invalid email: {value}")
    return value


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_filter_dict(filters: list[FilterParam]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for f in filters:
        if f.operator == "eq":
            result[f.field] = f.value
        elif f.operator == "gte":
            result[f"{f.field}_gte"] = f.value
        elif f.operator == "lte":
            result[f"{f.field}_lte"] = f.value
        elif f.operator == "contains":
            result[f"{f.field}_contains"] = f.value
        elif f.operator == "in":
            result[f"{f.field}_in"] = f.value
        elif f.operator == "is_null":
            result[f"{f.field}_is_null"] = True
    return result
