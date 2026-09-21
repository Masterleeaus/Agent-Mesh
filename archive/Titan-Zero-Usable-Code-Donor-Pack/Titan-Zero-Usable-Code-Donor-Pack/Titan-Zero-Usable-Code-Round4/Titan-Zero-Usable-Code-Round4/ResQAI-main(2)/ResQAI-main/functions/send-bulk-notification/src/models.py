from typing import Optional
from pydantic import BaseModel, Field


class BulkNotificationRecipient(BaseModel):
    recipient_id: str = Field(description="UUID of the recipient.")
    recipient_type: str = Field(description="Type of recipient: user or customer.")
    channel: str = Field(description="Dispatch channel: in_app, email, or sms.")
    recipient_address: str = Field(description="Email address or phone number for dispatch.")


class BulkNotificationResult(BaseModel):
    notification_id: str = Field(description="The created notification UUID.")
    recipient_id: str = Field(description="The recipient UUID.")
    status: str = Field(description="Dispatch status: sent or failed.")
    error: Optional[str] = Field(default=None, description="Error detail if dispatch failed.")


class SendBulkNotificationInput(BaseModel):
    notification_type: str = Field(description="Type/category of notification.")
    subject_template: str = Field(description="Subject line template.")
    body_template: str = Field(description="Body content template.")
    recipients: list[BulkNotificationRecipient] = Field(description="List of recipients to notify.")
    correlation_id: Optional[str] = Field(default=None, description="Optional correlation ID for grouping.")


class SendBulkNotificationOutput(BaseModel):
    total_dispatched: int = Field(description="Number of notifications successfully dispatched.")
    results: list[BulkNotificationResult] = Field(description="Per-recipient dispatch results.")