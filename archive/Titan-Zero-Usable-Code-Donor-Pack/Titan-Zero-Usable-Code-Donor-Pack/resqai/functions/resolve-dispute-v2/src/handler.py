#input_type_name: ResolveDisputeV2Input
#output_type_name: ResolveDisputeV2Output
#function_name: resolve_dispute_v2

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import ResolveDisputeV2Input, ResolveDisputeV2Output


async def resolve_dispute_v2(ctx: FunctionContext, data: ResolveDisputeV2Input) -> ResolveDisputeV2Output:
    pod = Pod.from_env()

    dispute = pod.records.get("disputes", data.dispute_id)
    if not dispute:
        return ResolveDisputeV2Output(
            status="error",
            dispute_id=data.dispute_id,
            resolution_type=data.resolution_type,
            error=f"Dispute {data.dispute_id} not found",
        )

    if dispute.get("status") == "closed":
        return ResolveDisputeV2Output(
            status="error",
            dispute_id=data.dispute_id,
            resolution_type=data.resolution_type,
            error=f"Dispute {data.dispute_id} is already closed",
        )

    updates = {
        "status": "closed",
        "resolution_type": data.resolution_type,
        "resolution_notes": data.resolution_notes,
        "resolved_by": data.resolved_by,
        "closed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    pod.records.update("disputes", data.dispute_id, updates)

    ticket_id = dispute.get("ticket_id")
    if ticket_id:
        ticket = pod.records.get("tickets", ticket_id)
        if ticket and ticket.get("status") != "closed":
            pod.records.update("tickets", ticket_id, {
                "status": "closed",
                "resolution_type": data.resolution_type,
                "resolution_notes": data.resolution_notes,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

    if data.notify_customer:
        _send_resolution_notification(pod, data, dispute)

    pod.records.create("operations_log", {
        "action": "resolve_dispute_v2",
        "result": f"dispute_id={data.dispute_id}, resolution_type={data.resolution_type}, "
                  f"ticket_id={ticket_id or 'none'}, notify={data.notify_customer}",
        "actor": data.resolved_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return ResolveDisputeV2Output(
        status="success",
        dispute_id=data.dispute_id,
        resolution_type=data.resolution_type,
    )


def _send_resolution_notification(pod: Pod, data: ResolveDisputeV2Input, dispute: dict) -> None:
    message = (
        f"Your dispute (ID: {data.dispute_id}) has been resolved.\n"
        f"Resolution: {data.resolution_type}\n"
        f"Notes: {data.resolution_notes or 'N/A'}"
    )
    try:
        pod.connectors.execute(
            "discord",
            "chat_post_message",
            {
                "channel": "customer-notifications",
                "text": f"📬 **Dispute Resolution Notification**\n{message}",
            },
        )
    except Exception:
        pass
    try:
        customer_email = dispute.get("customer_email")
        if customer_email:
            pod.connectors.execute(
                "gmail",
                "send_email",
                {
                    "to": customer_email,
                    "subject": f"Dispute Resolution - {data.dispute_id}",
                    "body": message,
                },
            )
    except Exception:
        pass
