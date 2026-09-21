#input_type_name: ResolveDisputeInput
#output_type_name: ResolveDisputeResult
#function_name: resolve_dispute

from typing import Optional
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class ResolveDisputeInput(BaseModel):
    dispute_id: str
    action: str  # "approve" | "reject"
    recommended_resolution: Optional[str] = None
    resolution_reason: Optional[str] = None
    confidence: Optional[float] = None
    human_notes: Optional[str] = None
    analysis_status: Optional[str] = None
    ticket_id: Optional[str] = None


class ResolveDisputeResult(BaseModel):
    status: str
    dispute_id: str
    ticket_id: Optional[str] = None
    error: Optional[str] = None


async def resolve_dispute(ctx: FunctionContext, data: ResolveDisputeInput) -> ResolveDisputeResult:
    pod = Pod.from_env()

    dispute = pod.records.get("disputes", data.dispute_id)
    if not dispute:
        return ResolveDisputeResult(
            status="error",
            dispute_id=data.dispute_id,
            error=f"Dispute {data.dispute_id} not found",
        )

    if data.action == "approve":
        updates = {
            "status": "closed",
            "recommended_resolution": data.recommended_resolution,
            "resolution_reason": data.resolution_reason,
            "confidence": data.confidence,
        }
        if data.human_notes:
            updates["human_notes"] = data.human_notes

        pod.records.update("disputes", data.dispute_id, updates)

        if data.ticket_id:
            ticket = pod.records.get("tickets", data.ticket_id)
            if ticket:
                pod.records.update("tickets", data.ticket_id, {
                    "status": "closed",
                    "human_notes": data.human_notes,
                })

        pod.records.create("operations_log", {
            "action": "dispute resolution approved",
            "result": f"dispute={data.dispute_id}, resolution={data.recommended_resolution}, confidence={data.confidence}",
            "actor": "workflow:dispute-resolution",
        })

        try:
            pod.connectors.execute(
                "resqai-discord",
                "chat_post_message",
                {
                    "channel": "support-escalations",
                    "text": (
                        f"✅ **Dispute Resolved**\n"
                        f"**Dispute:** {data.dispute_id}\n"
                        f"**Resolution:** {data.recommended_resolution}\n"
                        f"**Confidence:** {data.confidence}\n"
                        f"**Reason:** {data.resolution_reason or 'N/A'}"
                    ),
                },
            )
        except Exception:
            pass

        return ResolveDisputeResult(
            status="success",
            dispute_id=data.dispute_id,
            ticket_id=data.ticket_id,
        )

    elif data.action == "reject":
        pod.records.update("disputes", data.dispute_id, {
            "status": "open",
            "recommended_resolution": None,
            "resolution_reason": None,
            "confidence": None,
            "human_notes": data.human_notes,
        })

        pod.records.create("operations_log", {
            "action": "dispute resolution rejected",
            "result": f"dispute={data.dispute_id}, returned to open for re-analysis",
            "actor": "workflow:dispute-resolution",
        })

        try:
            pod.connectors.execute(
                "resqai-discord",
                "chat_post_message",
                {
                    "channel": "support-escalations",
                    "text": (
                        f"🔄 **Dispute Rejected — Returned for Re-Analysis**\n"
                        f"**Dispute:** {data.dispute_id}\n"
                        f"**Notes:** {data.human_notes or 'N/A'}"
                    ),
                },
            )
        except Exception:
            pass

        return ResolveDisputeResult(
            status="success",
            dispute_id=data.dispute_id,
            ticket_id=data.ticket_id,
        )

    else:
        return ResolveDisputeResult(
            status="error",
            dispute_id=data.dispute_id,
            error=f"Unknown action '{data.action}'. Must be 'approve' or 'reject'.",
        )
