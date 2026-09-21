from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteUserInput, DeleteUserOutput


async def delete_user(ctx: FunctionContext, data: DeleteUserInput) -> DeleteUserOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "users_v2", "User", correlation_id=data.correlation_id, function_name="delete_user")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("user", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteUserOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "user", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteUserOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteUserOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
