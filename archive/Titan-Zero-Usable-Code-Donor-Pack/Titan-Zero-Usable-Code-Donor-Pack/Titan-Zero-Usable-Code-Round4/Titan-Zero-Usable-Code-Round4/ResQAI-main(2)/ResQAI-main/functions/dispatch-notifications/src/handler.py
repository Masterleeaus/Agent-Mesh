#input_type_name: DispatchNotificationsInput
#output_type_name: DispatchNotificationsOutput
#function_name: dispatch_notifications

from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class Reminder(BaseModel):
    appointment_id: str = Field(description="The appointment UUID.")
    customer_id: str = Field(description="Customer UUID.")
    customer_name: str = Field(description="Customer name for personalization.")
    channel: str = Field(description="Preferred channel: email or sms.")
    recipient: str = Field(description="Email address or phone number.")
    message: str = Field(description="The reminder message body.")
    technician: Optional[str] = Field(default=None, description="Assigned technician name.")


class DispatchNotificationsInput(BaseModel):
    reminders: list[Reminder] = Field(description="List of reminder messages to dispatch.")
    channels: list[str] = Field(default_factory=lambda: ["email", "sms"], description="Allowed dispatch channels.")


class DispatchNotificationsOutput(BaseModel):
    dispatched: int = Field(description="Number of notifications successfully dispatched.")
    failures: list[dict] = Field(description="List of failed dispatch attempts with reason.")


async def dispatch_notifications(ctx: FunctionContext, data: DispatchNotificationsInput) -> DispatchNotificationsOutput:
    pod = Pod.from_env()
    dispatched_count = 0
    failures: list[dict] = []

    for reminder in data.reminders:
        if reminder.channel not in data.channels:
            failures.append({
                "appointment_id": reminder.appointment_id,
                "channel": reminder.channel,
                "reason": f"Channel '{reminder.channel}' not in allowed channels: {data.channels}",
            })
            continue

        try:
            if reminder.channel == "email":
                pod.connectors.execute(
                    "resqai-gmail",
                    "gmail_send_email",
                    {
                        "recipient_email": reminder.recipient,
                        "subject": f"Reminder: Upcoming Appointment",
                        "body": reminder.message,
                    },
                )
            elif reminder.channel == "sms":
                pod.connectors.execute(
                    "resqai-twilio",
                    "send_sms",
                    {
                        "to": reminder.recipient,
                        "body": reminder.message,
                    },
                )
            dispatched_count += 1
        except Exception as e:
            failures.append({
                "appointment_id": reminder.appointment_id,
                "channel": reminder.channel,
                "reason": str(e),
            })

    pod.records.create("operations_log", {
        "action": "dispatch_notifications",
        "result": f"dispatched={dispatched_count}, failures={len(failures)}",
        "actor": "workflow:appointment-reminders",
    })

    return DispatchNotificationsOutput(
        dispatched=dispatched_count,
        failures=failures,
    )
