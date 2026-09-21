from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteInventoryItemInput, DeleteInventoryItemOutput


async def delete_inventory_item(ctx: FunctionContext, data: DeleteInventoryItemInput) -> DeleteInventoryItemOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "inventory_items_v2", "Inventory Item", correlation_id=data.correlation_id, function_name="delete_inventory_item")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("inventory_item", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteInventoryItemOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "inventory_item", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteInventoryItemOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteInventoryItemOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
