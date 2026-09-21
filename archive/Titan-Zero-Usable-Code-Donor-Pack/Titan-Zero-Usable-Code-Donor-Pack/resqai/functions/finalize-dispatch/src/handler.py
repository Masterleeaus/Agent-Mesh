#input_type_name: FinalizeDispatchInput
#output_type_name: FinalizeDispatchOutput
#function_name: finalize_dispatch

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class FinalizeDispatchInput(BaseModel):
    ticket_id: str = Field(description="The ticket UUID being dispatched.")
    assigned_technician: Optional[str] = Field(default=None, description="Technician name assigned to this ticket.")
    dispatch_notes: Optional[str] = Field(default=None, description="Notes from the dispatch process.")
    dispatcher: str = Field(description="who performed the dispatch: workflow:urgent-dispatch or human:manager.")
    status: str = Field(description="Dispatch status: dispatched, manual_assignment, or escalation.")


class FinalizeDispatchOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    ticket_id: str = Field(description="Echoed ticket_id for workflow tracking.")
    audit_logged: bool = Field(description="True if operations_log entry was written.")
    error: Optional[str] = Field(default=None, description="Error detail if update failed.")


async def finalize_dispatch(ctx: FunctionContext, data: FinalizeDispatchInput) -> FinalizeDispatchOutput:
    pod = Pod.from_env()

    ticket = pod.records.get("tickets", data.ticket_id)
    if not ticket:
        return FinalizeDispatchOutput(
            status="not_found",
            ticket_id=data.ticket_id,
            audit_logged=False,
            error=f"Ticket {data.ticket_id} not found",
        )

    ticket_updates = {"status": "closed"}
    if data.assigned_technician:
        ticket_updates["owner"] = data.assigned_technician
    if data.dispatch_notes:
        ticket_updates["human_notes"] = data.dispatch_notes

    pod.records.update("tickets", data.ticket_id, ticket_updates)

    pod.records.create("operations_log", {
        "action": "urgent dispatch",
        "result": (
            f"ticket_id={data.ticket_id}, "
            f"assigned_to={data.assigned_technician or 'unassigned'}, "
            f"dispatcher={data.dispatcher}, "
            f"status={data.status}"
        ),
        "actor": data.dispatcher,
    })

    if data.status in ("dispatched", "manual_assignment"):
        technician = data.assigned_technician or "Unassigned"
        message = (
            f"🚨 **Urgent Dispatch**\n"
            f"**Ticket:** {data.ticket_id}\n"
            f"**Assigned To:** {technician}\n"
            f"**Dispatcher:** {data.dispatcher}\n"
            f"**Status:** {data.status}"
        )
        if data.dispatch_notes:
            message += f"\n**Notes:** {data.dispatch_notes}"
        try:
            pod.connectors.execute(
                "resqai-discord",
                "chat_post_message",
                {"channel": "support-alerts", "text": message},
            )
        except Exception:
            pass

    return FinalizeDispatchOutput(
        status="success",
        ticket_id=data.ticket_id,
        audit_logged=True,
    )
