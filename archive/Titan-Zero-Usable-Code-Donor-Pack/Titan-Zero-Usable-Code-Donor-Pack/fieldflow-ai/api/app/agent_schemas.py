from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=500)
    confirm_action: bool = False


class AgentChatResponse(BaseModel):
    interaction_id: int
    reply: str
    intent: str
    confidence: float
    equipment_id: str | None
    requires_confirmation: bool
    action_status: str
    service_case_id: int | None
    recommended_actions: list[str]
    sources: list[str]
    created_at: datetime


class AgentInteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    interaction_id: int
    equipment_id: str | None
    user_message: str
    detected_intent: str
    confidence: float
    agent_response: str
    action_status: str
    service_case_id: int | None
    created_at: datetime