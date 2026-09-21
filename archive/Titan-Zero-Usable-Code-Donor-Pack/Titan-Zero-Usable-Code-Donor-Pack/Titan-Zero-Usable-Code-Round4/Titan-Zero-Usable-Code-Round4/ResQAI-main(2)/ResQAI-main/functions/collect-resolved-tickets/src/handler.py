#input_type_name: CollectResolvedTicketsInput
#output_type_name: CollectResolvedTicketsOutput
#function_name: collect_resolved_tickets

from datetime import date, datetime, timedelta
from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class CollectResolvedTicketsInput(BaseModel):
    lookback_days: int = Field(default=7, description="How many days back to search for closed tickets.")
    today: Optional[date] = Field(default=None, description="Override date for testing. Defaults to system date.")
    max_tickets: int = Field(default=50, description="Maximum tickets to return.")


class ResolvedTicket(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    message: str
    channel: str
    request_type: str
    urgency: str
    owner: Optional[str] = None
    status: str
    human_notes: Optional[str] = None
    closed_at: str


class CollectResolvedTicketsOutput(BaseModel):
    today: str
    lookback_days: int
    total_found: int
    tickets: list[ResolvedTicket]


async def collect_resolved_tickets(ctx: FunctionContext, data: CollectResolvedTicketsInput) -> CollectResolvedTicketsOutput:
    pod = Pod.from_env()
    ref_date = data.today or date.today()
    lookback_date = ref_date - timedelta(days=data.lookback_days)

    all_records = pod.records.list("tickets", limit=data.max_tickets).to_dict()["items"]

    resolved: list[ResolvedTicket] = []
    for r in all_records:
        if r.get("status") != "closed":
            continue
        resolved.append(ResolvedTicket(
            ticket_id=r["id"],
            customer_name=r.get("customer_name", ""),
            subject=r.get("subject", ""),
            message=r.get("message", ""),
            channel=r.get("channel", ""),
            request_type=r.get("request_type", ""),
            urgency=r.get("urgency", ""),
            owner=r.get("owner"),
            status=r.get("status", ""),
            human_notes=r.get("human_notes"),
            closed_at=r.get("updated_at", ""),
        ))

    if len(resolved) > 0:
        try:
            pod.connectors.execute(
                "resqai-discord",
                "chat_post_message",
                {
                    "channel": "support-reviews",
                    "text": (
                        f"📋 **Daily Satisfaction Monitor**\n"
                        f"**Resolved Tickets Found:** {len(resolved)}\n"
                        f"**Lookback:** {data.lookback_days} days\n"
                        f"**Review window:** {ref_date.isoformat()}"
                    ),
                },
            )
        except Exception:
            pass

    return CollectResolvedTicketsOutput(
        today=ref_date.isoformat(),
        lookback_days=data.lookback_days,
        total_found=len(resolved),
        tickets=resolved[:data.max_tickets],
    )
