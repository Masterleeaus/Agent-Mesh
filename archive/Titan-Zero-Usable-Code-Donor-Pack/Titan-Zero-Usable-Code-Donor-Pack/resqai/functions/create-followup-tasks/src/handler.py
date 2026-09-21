#input_type_name: CreateFollowupTasksInput
#output_type_name: CreateFollowupTasksOutput
#function_name: create_followup_tasks

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class Recommendation(BaseModel):
    account_id: str = Field(description="Account UUID to create the task for.")
    customer_id: str = Field(description="Customer UUID associated with the account.")
    action: str = Field(description="Description of the recommended action.")
    priority: str = Field(default="normal", description="Task priority.")
    due_offset_days: int = Field(default=3, description="Days from today for the due date.")
    notes: Optional[str] = Field(default=None, description="Additional context for the task.")


class CreateFollowupTasksInput(BaseModel):
    recommendations: list[Recommendation] = Field(description="List of recommendations from the health/analysis agent.")
    today: Optional[date] = Field(default=None, description="Override date for testing. Defaults to system date.")
    category: str = Field(default="remediation", description="Task category label for the operations_log.")


class CreateFollowupTasksOutput(BaseModel):
    tasks_created: int = Field(description="Number of tasks successfully created.")
    audit_logged: bool = Field(description="True if an operations_log entry was written.")


async def create_followup_tasks(ctx: FunctionContext, data: CreateFollowupTasksInput) -> CreateFollowupTasksOutput:
    pod = Pod.from_env()
    ref_date = data.today or date.today()
    created_count = 0

    for rec in data.recommendations:
        due_date = date(
            ref_date.year, ref_date.month, ref_date.day
        ).isoformat()

        pod.records.create("tasks", {
            "account_id": rec.account_id,
            "customer_id": rec.customer_id,
            "action": rec.action,
            "priority": rec.priority,
            "status": "pending",
            "due_date": due_date,
            "notes": rec.notes or "",
            "category": data.category,
        })
        created_count += 1

    pod.records.create("operations_log", {
        "action": "create_followup_tasks",
        "result": f"created={created_count}, category={data.category}",
        "actor": "workflow:followup-slippage",
    })

    return CreateFollowupTasksOutput(
        tasks_created=created_count,
        audit_logged=True,
    )
