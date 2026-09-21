from datetime import datetime

from pydantic import BaseModel, ConfigDict

from api.app.models import TelemetryReading


class AutomationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: int
    equipment_id: str
    event_type: str
    outcome: str
    details: str
    service_case_id: int | None
    created_at: datetime


class AutomationEvaluationResponse(BaseModel):
    equipment_id: str
    outcome: str
    message: str
    service_case_id: int | None
    event_id: int
    evaluated_at: datetime
    telemetry: TelemetryReading