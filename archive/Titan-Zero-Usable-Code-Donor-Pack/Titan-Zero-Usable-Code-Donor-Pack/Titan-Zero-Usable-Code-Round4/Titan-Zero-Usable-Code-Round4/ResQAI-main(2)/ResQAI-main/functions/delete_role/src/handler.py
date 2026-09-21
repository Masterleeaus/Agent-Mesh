from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteRoleInput, DeleteRoleOutput


async def delete_role(ctx: FunctionContext, data: DeleteRoleInput) -> DeleteRoleOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "user_roles_v2", "Role", correlation_id=data.correlation_id, function_name="delete_role")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("role", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteRoleOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "role", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteRoleOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteRoleOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
