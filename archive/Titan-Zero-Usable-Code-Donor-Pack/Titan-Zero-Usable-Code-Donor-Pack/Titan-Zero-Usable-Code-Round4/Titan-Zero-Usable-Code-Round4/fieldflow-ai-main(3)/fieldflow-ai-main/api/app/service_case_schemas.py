from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ServiceCasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ServiceCaseStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    SCHEDULED = "scheduled"
    RESOLVED = "resolved"


class ServiceCaseSource(str, Enum):
    MANUAL = "manual"
    TELEMETRY = "telemetry"
    AUTOMATION = "automation"
    AI_AGENT = "ai_agent"


class ServiceCaseCreate(BaseModel):
    equipment_id: str
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=1000)
    priority: ServiceCasePriority
    source: ServiceCaseSource = ServiceCaseSource.MANUAL
    assigned_to: str | None = Field(
        default=None,
        max_length=100,
    )


class ServiceCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    equipment_id: str
    title: str
    description: str
    priority: ServiceCasePriority
    status: ServiceCaseStatus
    source: ServiceCaseSource
    assigned_to: str | None
    created_at: datetime
    updated_at: datetime