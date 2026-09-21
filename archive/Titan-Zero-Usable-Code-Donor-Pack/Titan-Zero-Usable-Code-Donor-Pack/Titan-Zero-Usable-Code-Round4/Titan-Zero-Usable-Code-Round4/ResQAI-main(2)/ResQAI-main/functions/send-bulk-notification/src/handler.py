from src.models import SendBulkNotificationInput, SendBulkNotificationOutput, BulkNotificationResult
from lemma_sdk import FunctionContext, Pod
import uuid


async def send_bulk_notification(ctx: FunctionContext, data: SendBulkNotificationInput) -> SendBulkNotificationOutput:
    pod = Pod.from_env()

    results = []

    for recipient in data.recipients:
        notification_id = str(uuid.uuid4())
        status = "sent"
        error_message = None

        if recipient.channel in ("email", "sms"):
            try:
                if recipient.channel == "email":
                    pod.connectors.execute(
                        "resqai-gmail",
                        "gmail_send_email",
                        {
                            "recipient_email": recipient.recipient_address,
                            "subject": data.subject_template,
                            "body": data.body_template,
                        },
                    )
                elif recipient.channel == "sms":
                    pod.connectors.execute(
                        "resqai-twilio",
                        "send_sms",
                        {
                            "to": recipient.recipient_address,
                            "body": data.body_template,
                        },
                    )
            except Exception as e:
                status = "failed"
                error_message = str(e)

        pod.records.create("notifications", {
            "notification_id": notification_id,
            "recipient_id": recipient.recipient_id,
            "recipient_type": recipient.recipient_type,
            "notification_type": data.notification_type,
            "channel": recipient.channel,
            "subject": data.subject_template,
            "body": data.body_template,
            "status": status,
            "correlation_id": data.correlation_id or "",
        })

        results.append(BulkNotificationResult(
            notification_id=notification_id,
            recipient_id=recipient.recipient_id,
            status=status,
            error=error_message,
        ))

    total_dispatched = sum(1 for r in results if r.status == "sent")

    return SendBulkNotificationOutput(
        total_dispatched=total_dispatched,
        results=results,
    )