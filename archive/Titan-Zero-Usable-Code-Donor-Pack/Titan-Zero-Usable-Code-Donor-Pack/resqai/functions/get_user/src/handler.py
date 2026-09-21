from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetUserInput, GetUserOutput


async def get_user(ctx: FunctionContext, data: GetUserInput) -> GetUserOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "users_v2", "User", correlation_id=data.correlation_id, function_name="get_user")

    try:
        record = svc.repo.get(data.record_id)
        return GetUserOutput(status="success", data=record, meta={"entity": "user", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetUserOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetUserOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
