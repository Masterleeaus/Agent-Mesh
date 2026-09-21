from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import UpdateUserInput, UpdateUserOutput


async def update_user(ctx: FunctionContext, data: UpdateUserInput) -> UpdateUserOutput:
    pod = Pod.from_env()

    user = pod.records.get("users", data.user_id)
    if not user:
        return UpdateUserOutput(
            status="not_found",
            user_id=data.user_id,
            error=f"User {data.user_id} not found",
        )

    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.email is not None:
        updates["email"] = data.email
    if data.role_id is not None:
        updates["role_id"] = data.role_id
    if data.status is not None:
        updates["status"] = data.status
    if data.preferences_config is not None:
        updates["preferences_config"] = data.preferences_config

    if not updates:
        return UpdateUserOutput(
            status="success",
            user_id=data.user_id,
        )

    updates["updated_at"] = datetime.utcnow().isoformat()
    pod.records.update("users", data.user_id, updates)

    pod.records.create("operations_log", {
        "action": "user updated",
        "result": f"user_id={data.user_id}, fields={list(updates.keys())}",
        "actor": data.updated_by or "system",
    })

    return UpdateUserOutput(status="success", user_id=data.user_id)
