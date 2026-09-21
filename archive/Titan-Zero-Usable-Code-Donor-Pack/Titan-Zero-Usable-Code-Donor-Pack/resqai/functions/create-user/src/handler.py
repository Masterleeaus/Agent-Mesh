from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import CreateUserInput, CreateUserOutput


async def create_user(ctx: FunctionContext, data: CreateUserInput) -> CreateUserOutput:
    if "@" not in data.email:
        return CreateUserOutput(status="error", error="Invalid email format")

    pod = Pod.from_env()

    existing = pod.records.list("users", {"email": data.email})
    if existing:
        return CreateUserOutput(status="error", error="Email already exists")

    now = datetime.utcnow().isoformat()
    record = pod.records.create("users", {
        "email": data.email,
        "name": data.name,
        "role_id": data.role_id,
        "auth_provider": data.auth_provider,
        "auth_provider_id": data.auth_provider_id,
        "preferences_config": data.preferences_config or {},
        "status": "active",
        "created_at": now,
        "updated_at": now,
    })

    pod.records.create("operations_log", {
        "action": "user created",
        "result": f"user_id={record.get('id')}, email={data.email}, role_id={data.role_id}",
        "actor": data.created_by or "system",
    })

    return CreateUserOutput(status="success", user_id=record.get("id"))
