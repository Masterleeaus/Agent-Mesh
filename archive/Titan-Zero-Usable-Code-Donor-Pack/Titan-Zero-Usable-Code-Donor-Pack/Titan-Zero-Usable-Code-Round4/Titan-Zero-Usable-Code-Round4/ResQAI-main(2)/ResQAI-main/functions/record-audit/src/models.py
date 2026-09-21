from typing import Optional
from pydantic import BaseModel, Field


class RecordAuditInput(BaseModel):
    entity_type: str = Field(description="Type of entity being audited (e.g. ticket, user).")
    entity_id: str = Field(description="UUID of the entity.")
    action: str = Field(description="Action performed (e.g. created, updated, deleted).")
    actor_type: str = Field(description="Type of actor (user, system, workflow).")
    actor_id: Optional[str] = Field(default=None, description="UUID of the actor.")
    previous_state: Optional[dict] = Field(default=None, description="Snapshot of state before the action.")
    new_state: Optional[dict] = Field(default=None, description="Snapshot of state after the action.")
    changed_fields: Optional[list[str]] = Field(default=None, description="List of field names that changed.")
    ip_address: Optional[str] = Field(default=None, description="IP address of the actor.")
    user_agent: Optional[str] = Field(default=None, description="User agent string from the request.")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing related events.")


class RecordAuditOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    audit_id: Optional[str] = Field(default=None, description="UUID of the created audit entry.")
    error: Optional[str] = Field(default=None, description="Error detail if recording failed.")
