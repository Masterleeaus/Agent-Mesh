from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import AssignUserRoleInput, AssignUserRoleOutput


async def assign_user_role(ctx: FunctionContext, data: AssignUserRoleInput) -> AssignUserRoleOutput:
    pod = Pod.from_env()

    user = pod.records.get("users", data.user_id)
    if not user:
        return AssignUserRoleOutput(
            status="not_found",
            user_id=data.user_id,
            role_id=data.role_id,
            error=f"User {data.user_id} not found",
        )

    role = pod.records.get("user_roles", data.role_id)
    if not role:
        return AssignUserRoleOutput(
            status="not_found",
            user_id=data.user_id,
            role_id=data.role_id,
            error=f"Role {data.role_id} not found",
        )

    pod.records.update("users", data.user_id, {
        "role_id": data.role_id,
        "updated_at": datetime.utcnow().isoformat(),
    })

    pod.records.create("operations_log", {
        "action": "user role assigned",
        "result": f"user_id={data.user_id}, role_id={data.role_id}",
        "actor": data.assigned_by,
    })

    return AssignUserRoleOutput(status="success", user_id=data.user_id, role_id=data.role_id)
