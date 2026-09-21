from typing import Any, Optional
from pydantic import BaseModel, Field


ENTITY_MAP = {
    "customer": "customers_v2",
    "ticket": "tickets_v2", 
    "technician": "technicians_v2",
    "appointment": "appointments_v2",
    "work_order": "work_orders_v2",
    "dispatch": "dispatches_v2",
    "dispute": "disputes_v2",
    "followup": "followups_v2",
    "user": "users_v2",
    "role": "user_roles_v2",
    "account": "accounts_v2",
    "inventory_item": "inventory_items_v2",
    "inventory_transaction": "inventory_transactions_v2",
    "notification": "notifications_v2",
    "feedback": "feedback_v2",
    "knowledge_article": "knowledge_articles_v2",
    "knowledge_category": "knowledge_categories_v2",
    "task": "tasks_v2",
    "customer_address": "customer_addresses_v2",
    "analytics_report": "analytics_reports_v2",
    "analytics_schedule": "analytics_schedules_v2",
    "account_health_scan": "account_health_scans_v2",
    "technician_skill": "technician_skills_v2",
    "ticket_message": "ticket_messages_v2",
    "ticket_attachment": "ticket_attachments_v2",
    "dispute_evidence": "dispute_evidence_v2",
    "followup_attempt": "followup_attempts_v2",
    "task_assignment": "task_assignments_v2",
}

VALID_OPERATIONS = ["create", "get", "update", "delete", "list", "exists"]


class FilterDef(BaseModel):
    field: str = Field(description="Field name")
    operator: str = Field(default="eq", description="eq, neq, gt, gte, lt, lte, contains, in, between, is_null")
    value: Any = Field(default=None, description="Filter value")


class SortDef(BaseModel):
    sort_by: str = Field(description="Field to sort by")
    sort_dir: str = Field(default="desc", description="asc or desc")


class PaginationDef(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=200)


class SearchDef(BaseModel):
    query: str = Field(description="Search query")
    fields: Optional[list[str]] = Field(default=None, description="Fields to search in")


class EntityCrudInput(BaseModel):
    entity: str = Field(description=f"Entity type. One of: {', '.join(sorted(ENTITY_MAP.keys()))}")
    operation: str = Field(description=f"Operation: {', '.join(VALID_OPERATIONS)}")
    record_id: Optional[str] = Field(default=None, description="Record ID for get/update/delete operations")
    data: Optional[dict[str, Any]] = Field(default=None, description="Data payload for create/update operations")
    expected_version: Optional[int] = Field(default=None, description="Expected version for optimistic locking")
    filters: Optional[list[FilterDef]] = Field(default=None, description="Filters for list operation")
    sort: Optional[SortDef] = Field(default=None, description="Sort params for list operation")
    pagination: Optional[PaginationDef] = Field(default=None, description="Pagination for list operation")
    search: Optional[SearchDef] = Field(default=None, description="Search params for list operation")
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for create operations")
    actor_type: str = Field(default="system", description="Actor type for audit logging")
    actor_id: Optional[str] = Field(default=None, description="Actor ID for audit logging")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")


class EntityCrudOutput(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[Any] = Field(default=None, description="Response data")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    pagination: Optional[dict[str, Any]] = Field(default=None, description="Pagination info")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata including entity, correlation_id")
