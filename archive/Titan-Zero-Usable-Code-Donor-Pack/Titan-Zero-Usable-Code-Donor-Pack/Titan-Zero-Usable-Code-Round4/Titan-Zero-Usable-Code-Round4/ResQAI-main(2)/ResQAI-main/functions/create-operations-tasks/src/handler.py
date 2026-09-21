#input_type_name: CreateOperationsTasksInput
#output_type_name: CreateOperationsTasksOutput
#function_name: create_operations_tasks

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class OperationRecommendation(BaseModel):
    team: str = Field(description="Target team: dispatch, field, or office.")
    action: str = Field(description="Description of the operation task.")
    priority: str = Field(default="normal", description="Task priority.")
    assigned_to: Optional[str] = Field(default=None, description="Team member to assign.")
    notes: Optional[str] = Field(default=None, description="Operational context.")


class CreateOperationsTasksInput(BaseModel):
    recommendations: list[OperationRecommendation] = Field(description="List of operation recommendations from the coordinator agent.")
    today: Optional[date] = Field(default=None, description="Override date for testing. Defaults to system date.")
    scope: str = Field(default="daily", description="Operations scope: daily, weekly, or ad_hoc.")


class CreateOperationsTasksOutput(BaseModel):
    tasks_created: int = Field(description="Number of operations tasks created.")
    teams: list[str] = Field(description="List of teams that received tasks.")
    audit_logged: bool = Field(description="True if an operations_log entry was written.")


async def create_operations_tasks(ctx: FunctionContext, data: CreateOperationsTasksInput) -> CreateOperationsTasksOutput:
    pod = Pod.from_env()
    ref_date = data.today or date.today()
    created_count = 0
    teams: set[str] = set()

    for rec in data.recommendations:
        due_date = ref_date.isoformat()
        teams.add(rec.team)

        pod.records.create("tasks", {
            "team": rec.team,
            "action": rec.action,
            "priority": rec.priority,
            "assigned_to": rec.assigned_to or "",
            "status": "pending",
            "due_date": due_date,
            "notes": rec.notes or "",
            "scope": data.scope,
            "category": "operations",
        })
        created_count += 1

    pod.records.create("operations_log", {
        "action": "create_operations_tasks",
        "result": f"created={created_count}, scope={data.scope}, teams={','.join(sorted(teams))}",
        "actor": "workflow:daily-standup",
    })

    return CreateOperationsTasksOutput(
        tasks_created=created_count,
        teams=sorted(teams),
        audit_logged=True,
    )
