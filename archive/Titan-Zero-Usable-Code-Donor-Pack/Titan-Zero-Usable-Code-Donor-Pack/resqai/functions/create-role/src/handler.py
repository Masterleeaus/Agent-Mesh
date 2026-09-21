from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import CreateRoleInput, CreateRoleOutput


async def create_role(ctx: FunctionContext, data: CreateRoleInput) -> CreateRoleOutput:
    pod = Pod.from_env()

    existing = pod.records.list("user_roles", {"name": data.name})
    if existing:
        return CreateRoleOutput(status="error", error="Role name already exists")

    now = datetime.utcnow().isoformat()
    record = pod.records.create("user_roles", {
        "name": data.name,
        "description": data.description or "",
        "is_system": data.is_system,
        "created_at": now,
        "updated_at": now,
    })

    pod.records.create("operations_log", {
        "action": "role created",
        "result": f"role_id={record.get('id')}, name={data.name}",
        "actor": "system",
    })

    return CreateRoleOutput(status="success", role_id=record.get("id"))
