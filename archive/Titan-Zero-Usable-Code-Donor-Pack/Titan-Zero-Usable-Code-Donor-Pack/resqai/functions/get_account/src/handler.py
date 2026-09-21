from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetAccountInput, GetAccountOutput


async def get_account(ctx: FunctionContext, data: GetAccountInput) -> GetAccountOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "accounts_v2", "Account", correlation_id=data.correlation_id, function_name="get_account")

    try:
        record = svc.repo.get(data.record_id)
        return GetAccountOutput(status="success", data=record, meta={"entity": "account", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetAccountOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetAccountOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
