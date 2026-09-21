from typing import Optional
from pydantic import BaseModel, Field


class DispatchNotificationV2Input(BaseModel):
    recipient_id: str = Field(description="UUID of the recipient (user or customer).")
    recipient_type: str = Field(description="Type of recipient: user or customer.")
    notification_type: str = Field(description="Type/category of notification.")
    channel: str = Field(description="Dispatch channel: in_app, email, or sms.")
    subject: str = Field(description="Notification subject line.")
    body: str = Field(description="Notification body content.")
    correlation_id: Optional[str] = Field(default=None, description="Optional correlation ID for grouping notifications.")


class DispatchNotificationV2Output(BaseModel):
    status: str = Field(description="Operation result status: success, sent, failed, or error.")
    notification_id: Optional[str] = Field(default=None, description="The created notification UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if dispatch failed.")