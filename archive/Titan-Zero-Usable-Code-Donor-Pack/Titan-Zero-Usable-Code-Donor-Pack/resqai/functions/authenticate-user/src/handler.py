from datetime import datetime, timedelta

from lemma_sdk import FunctionContext, Pod

from src.models import AuthenticateUserInput, AuthenticateUserOutput


async def authenticate_user(ctx: FunctionContext, data: AuthenticateUserInput) -> AuthenticateUserOutput:
    pod = Pod.from_env()

    users = pod.records.list("users", {"email": data.email})
    if not users:
        return AuthenticateUserOutput(status="error", error="User not found")

    user = users[0]

    if data.auth_provider and user.get("auth_provider") != data.auth_provider:
        return AuthenticateUserOutput(status="error", error="Auth provider mismatch")

    if data.auth_provider_id and user.get("auth_provider_id") != data.auth_provider_id:
        return AuthenticateUserOutput(status="error", error="Auth provider ID mismatch")

    now = datetime.utcnow()
    now_str = now.isoformat()

    pod.records.update("users", user["id"], {"last_login_at": now_str})

    session = pod.records.create("user_sessions", {
        "user_id": user["id"],
        "created_at": now_str,
        "expires_at": (now + timedelta(hours=24)).isoformat(),
        "is_invalidated": False,
    })

    pod.records.create("operations_log", {
        "action": "user authentication",
        "result": f"user_id={user['id']}, email={data.email}",
        "actor": "system",
    })

    return AuthenticateUserOutput(
        status="success",
        user_id=user["id"],
        name=user.get("name"),
        email=user.get("email"),
        role=user.get("role_id"),
        token=session.get("id"),
    )
