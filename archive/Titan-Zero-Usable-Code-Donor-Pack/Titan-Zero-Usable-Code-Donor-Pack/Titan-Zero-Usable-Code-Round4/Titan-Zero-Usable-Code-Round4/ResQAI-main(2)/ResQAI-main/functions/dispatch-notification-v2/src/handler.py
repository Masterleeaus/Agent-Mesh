from src.models import DispatchNotificationV2Input, DispatchNotificationV2Output
from lemma_sdk import FunctionContext, Pod
import uuid


async def dispatch_notification_v2(ctx: FunctionContext, data: DispatchNotificationV2Input) -> DispatchNotificationV2Output:
    pod = Pod.from_env()

    notification_id = str(uuid.uuid4())
    dispatch_status = "pending"
    error_message = None

    if data.channel in ("email", "sms"):
        try:
            if data.channel == "email":
                pod.connectors.execute(
                    "resqai-gmail",
                    "gmail_send_email",
                    {
                        "recipient_email": data.recipient_id,
                        "subject": data.subject,
                        "body": data.body,
                    },
                )
            elif data.channel == "sms":
                pod.connectors.execute(
                    "resqai-twilio",
                    "send_sms",
                    {
                        "to": data.recipient_id,
                        "body": data.body,
                    },
                )
            dispatch_status = "sent"
        except Exception as e:
            dispatch_status = "failed"
            error_message = str(e)

    pod.records.create("notifications", {
        "notification_id": notification_id,
        "recipient_id": data.recipient_id,
        "recipient_type": data.recipient_type,
        "notification_type": data.notification_type,
        "channel": data.channel,
        "subject": data.subject,
        "body": data.body,
        "status": dispatch_status,
        "correlation_id": data.correlation_id or "",
    })

    pod.records.create("operations_log", {
        "action": "dispatch_notification_v2",
        "result": f"notification_id={notification_id}, channel={data.channel}, status={dispatch_status}",
        "actor": "system",
    })

    if dispatch_status == "failed":
        return DispatchNotificationV2Output(
            status="failed",
            notification_id=notification_id,
            error=error_message,
        )

    return DispatchNotificationV2Output(
        status="sent",
        notification_id=notification_id,
    )