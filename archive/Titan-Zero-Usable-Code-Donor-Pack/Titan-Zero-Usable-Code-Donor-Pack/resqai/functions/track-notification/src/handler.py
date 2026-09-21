from src.models import TrackNotificationInput, TrackNotificationOutput
from lemma_sdk import FunctionContext, Pod


async def track_notification(ctx: FunctionContext, data: TrackNotificationInput) -> TrackNotificationOutput:
    pod = Pod.from_env()

    notification = None

    if data.notification_id:
        notification = pod.records.get("notifications", data.notification_id)
    elif data.correlation_id:
        matches = pod.records.list("notifications", filters={"correlation_id": data.correlation_id})
        if matches:
            notification = matches[0]

    if not notification:
        return TrackNotificationOutput(
            status="not_found",
            error="Notification not found",
        )

    if data.mark_read and notification.get("status") != "read":
        pod.records.update("notifications", notification["notification_id"], {"status": "read"})
        notification["status"] = "read"

    return TrackNotificationOutput(
        status="success",
        notification=notification,
    )