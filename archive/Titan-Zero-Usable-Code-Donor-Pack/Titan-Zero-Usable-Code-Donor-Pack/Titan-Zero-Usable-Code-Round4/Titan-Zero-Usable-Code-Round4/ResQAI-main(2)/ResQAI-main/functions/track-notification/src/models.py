from typing import Optional
from pydantic import BaseModel, Field


class TrackNotificationInput(BaseModel):
    notification_id: Optional[str] = Field(default=None, description="UUID of the notification to find.")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID to find notifications by.")
    mark_read: bool = Field(default=False, description="If true, mark the notification as read.")


class TrackNotificationOutput(BaseModel):
    status: str = Field(description="Operation result status: success, not_found, or error.")
    notification: Optional[dict] = Field(default=None, description="The notification record details.")
    error: Optional[str] = Field(default=None, description="Error detail if tracking failed.")