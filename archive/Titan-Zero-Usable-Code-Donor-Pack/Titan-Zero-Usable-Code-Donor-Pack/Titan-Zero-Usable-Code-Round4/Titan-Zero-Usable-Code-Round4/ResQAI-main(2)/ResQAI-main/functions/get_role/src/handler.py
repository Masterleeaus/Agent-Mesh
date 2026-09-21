from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetRoleInput, GetRoleOutput


async def get_role(ctx: FunctionContext, data: GetRoleInput) -> GetRoleOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "user_roles_v2", "Role", correlation_id=data.correlation_id, function_name="get_role")

    try:
        record = svc.repo.get(data.record_id)
        return GetRoleOutput(status="success", data=record, meta={"entity": "role", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetRoleOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetRoleOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
