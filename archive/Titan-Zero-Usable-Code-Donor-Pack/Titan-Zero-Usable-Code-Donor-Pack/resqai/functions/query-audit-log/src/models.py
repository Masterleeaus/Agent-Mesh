from typing import Optional
from pydantic import BaseModel, Field


class QueryAuditLogInput(BaseModel):
    entity_type: Optional[str] = Field(default=None, description="Filter by entity type.")
    entity_id: Optional[str] = Field(default=None, description="Filter by entity UUID.")
    action: Optional[str] = Field(default=None, description="Filter by action name.")
    actor_type: Optional[str] = Field(default=None, description="Filter by actor type.")
    actor_id: Optional[str] = Field(default=None, description="Filter by actor UUID.")
    correlation_id: Optional[str] = Field(default=None, description="Filter by correlation ID.")
    date_from: Optional[str] = Field(default=None, description="Include entries on or after this ISO timestamp.")
    date_to: Optional[str] = Field(default=None, description="Include entries on or before this ISO timestamp.")
    limit: int = Field(default=100, description="Maximum number of entries to return.")
    offset: int = Field(default=0, description="Number of entries to skip for pagination.")


class AuditEntry(BaseModel):
    audit_id: str = Field(description="Audit entry UUID.")
    entity_type: str = Field(description="Type of entity.")
    entity_id: str = Field(description="UUID of the entity.")
    action: str = Field(description="Action performed.")
    actor_type: str = Field(description="Type of actor.")
    actor_id: Optional[str] = Field(default=None, description="UUID of the actor.")
    previous_state: Optional[dict] = Field(default=None, description="State before the action.")
    new_state: Optional[dict] = Field(default=None, description="State after the action.")
    changed_fields: list[str] = Field(default=[], description="List of changed field names.")
    ip_address: Optional[str] = Field(default=None, description="Actor IP address.")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing.")
    created_at: str = Field(description="Timestamp when the audit entry was created.")


class QueryAuditLogOutput(BaseModel):
    total: int = Field(description="Total number of entries matching filters.")
    entries: list[AuditEntry] = Field(description="List of audit entries.")
