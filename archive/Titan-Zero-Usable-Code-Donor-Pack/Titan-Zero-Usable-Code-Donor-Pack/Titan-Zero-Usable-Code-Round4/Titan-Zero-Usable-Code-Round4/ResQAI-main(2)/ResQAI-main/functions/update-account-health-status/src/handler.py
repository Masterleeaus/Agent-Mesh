#input_type_name: UpdateAccountHealthStatusInput
#output_type_name: UpdateAccountHealthStatusOutput
#function_name: update_account_health_status

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class UpdateAccountHealthStatusInput(BaseModel):
    health_category: Literal["healthy", "warning", "critical"] = Field(
        description="The health branch taken in the workflow."
    )
    coordination_status: str = Field(
        description="Echo of the agent's coordination_status for audit context."
    )
    today: date = Field(description="ISO date of this workflow run.")
    summary: Optional[str] = Field(default=None, description="Agent-generated summary.")
    recovery_notes: Optional[str] = Field(
        default=None,
        description="Optional recovery plan notes from human escalation (critical path only).",
    )


class UpdateAccountHealthStatusOutput(BaseModel):
    status: Literal["completed"] = "completed"
    accounts_updated: int = Field(description="Number of accounts updated.")
    audit_logged: bool = Field(description="True if an operations_log entry was written.")


async def update_account_health_status(
    ctx: FunctionContext,
    data: UpdateAccountHealthStatusInput,
) -> UpdateAccountHealthStatusOutput:
    pod = Pod.from_env()

    notes = (
        f"workflow branch: {data.health_category} "
        f"(coordination_status: {data.coordination_status}). "
        f"{data.summary or ''}"
    )
    if data.recovery_notes:
        notes += f" | Recovery: {data.recovery_notes}"

    pod.records.create("operations_log", {
        "action": "account_health_monitor workflow",
        "result": notes.strip(),
        "actor": "update_account_health_status",
    })

    if data.health_category == "critical":
        try:
            pod.connectors.execute(
                "resqai-discord",
                "chat_post_message",
                {
                    "channel": "support-alerts",
                    "text": (
                        f"🚨 **Critical Account Health Alert**\n"
                        f"**Category:** {data.health_category}\n"
                        f"**Summary:** {data.summary or 'No summary available'}\n"
                        f"**Status:** {data.coordination_status}"
                    ),
                },
            )
        except Exception:
            pass

    return UpdateAccountHealthStatusOutput(
        status="completed",
        accounts_updated=0,
        audit_logged=True,
    )
