from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteWorkOrderInput, DeleteWorkOrderOutput


async def delete_work_order(ctx: FunctionContext, data: DeleteWorkOrderInput) -> DeleteWorkOrderOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "work_orders_v2", "Work Order", correlation_id=data.correlation_id, function_name="delete_work_order")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("work_order", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteWorkOrderOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "work_order", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteWorkOrderOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteWorkOrderOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
