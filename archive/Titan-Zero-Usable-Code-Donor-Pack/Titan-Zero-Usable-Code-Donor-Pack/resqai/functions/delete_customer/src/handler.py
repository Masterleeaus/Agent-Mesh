from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteCustomerInput, DeleteCustomerOutput


async def delete_customer(ctx: FunctionContext, data: DeleteCustomerInput) -> DeleteCustomerOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "customers_v2", "Customer", correlation_id=data.correlation_id, function_name="delete_customer")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("customer", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteCustomerOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "customer", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteCustomerOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteCustomerOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
