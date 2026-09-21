#input_type_name: FinalizeSlippageReviewInput
#output_type_name: FinalizeSlippageReviewOutput
#function_name: finalize_slippage_review

from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class FinalizeSlippageReviewInput(BaseModel):
    slippage_counts: dict = Field(description="Counts from the slippage scan")
    slipping_followups: list = Field(description="List of slipping followups")
    coordinator_summary: Optional[str] = Field(default=None, description="Summary from operations-coordinator")
    coordinator_recommendations: list = Field(default_factory=list, description="Recommendations from operations-coordinator")
    human_notes: Optional[str] = Field(default=None, description="Notes from human reviewer")
    approved: bool = Field(description="whether the reminders were approved")
    workflow_run_time: str = Field(description="ISO timestamp of the workflow run")


class FinalizeSlippageReviewOutput(BaseModel):
    status: str = Field(description="Operation result: success or error")
    audit_logged: bool = Field(description="True if operations_log entry was written")
    followup_count: int = Field(description="Number of slipping followups processed")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed")


async def finalize_slippage_review(ctx: FunctionContext, data: FinalizeSlippageReviewInput) -> FinalizeSlippageReviewOutput:
    pod = Pod.from_env()
    try:
        followup_ids = [f.get("followup_id", "?") for f in data.slipping_followups]
        result_detail = (
            f"approved={data.approved}, "
            f"slipping_count={data.slippage_counts.get('slipping', 0)}, "
            f"overdue={data.slippage_counts.get('overdue', 0)}, "
            f"due_today={data.slippage_counts.get('due_today', 0)}, "
            f"due_soon={data.slippage_counts.get('due_soon', 0)}, "
            f"followups={','.join(followup_ids[:10])}"
        )
        if len(followup_ids) > 10:
            result_detail += f",+{len(followup_ids) - 10} more"

        pod.records.create("operations_log", {
            "action": "followup-slippage review",
            "result": result_detail,
            "actor": "workflow:followup-slippage-detector",
        })

        if data.approved and data.slippage_counts.get("slipping", 0) > 0:
            try:
                pod.connectors.execute(
                    "resqai-discord",
                    "chat_post_message",
                    {
                        "channel": "support-alerts",
                        "text": (
                            f"⚠️ **Followup Slippage Alert**\n"
                            f"**Slipping:** {data.slippage_counts.get('slipping', 0)}\n"
                            f"**Overdue:** {data.slippage_counts.get('overdue', 0)}\n"
                            f"**Due Today:** {data.slippage_counts.get('due_today', 0)}\n"
                            f"**Approved:** {data.approved}\n"
                            f"**Summary:** {data.coordinator_summary or 'N/A'}"
                        ),
                    },
                )
            except Exception:
                pass

        return FinalizeSlippageReviewOutput(
            status="success",
            audit_logged=True,
            followup_count=len(data.slipping_followups),
        )
    except Exception as e:
        return FinalizeSlippageReviewOutput(
            status="error",
            audit_logged=False,
            followup_count=0,
            error=str(e),
        )
