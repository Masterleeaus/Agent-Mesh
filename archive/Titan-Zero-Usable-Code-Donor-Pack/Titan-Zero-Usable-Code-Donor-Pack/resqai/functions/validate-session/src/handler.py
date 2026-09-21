from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import ValidateSessionInput, ValidateSessionOutput


async def validate_session(ctx: FunctionContext, data: ValidateSessionInput) -> ValidateSessionOutput:
    pod = Pod.from_env()

    session = pod.records.get("user_sessions", data.session_id)
    if not session:
        return ValidateSessionOutput(
            status="success",
            valid=False,
            error="Session not found",
        )

    if session.get("is_invalidated"):
        return ValidateSessionOutput(
            status="success",
            user_id=session.get("user_id"),
            valid=False,
            error="Session has been invalidated",
        )

    expires_at = session.get("expires_at")
    if expires_at:
        try:
            expiry = datetime.fromisoformat(expires_at)
            if datetime.utcnow() > expiry:
                return ValidateSessionOutput(
                    status="success",
                    user_id=session.get("user_id"),
                    valid=False,
                    error="Session has expired",
                )
        except (ValueError, TypeError):
            pass

    return ValidateSessionOutput(
        status="success",
        user_id=session.get("user_id"),
        valid=True,
    )
