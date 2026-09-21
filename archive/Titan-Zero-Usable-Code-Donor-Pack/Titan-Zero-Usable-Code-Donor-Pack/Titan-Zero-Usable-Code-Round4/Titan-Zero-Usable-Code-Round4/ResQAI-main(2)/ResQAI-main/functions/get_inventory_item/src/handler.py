from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetInventoryItemInput, GetInventoryItemOutput


async def get_inventory_item(ctx: FunctionContext, data: GetInventoryItemInput) -> GetInventoryItemOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "inventory_items_v2", "Inventory Item", correlation_id=data.correlation_id, function_name="get_inventory_item")

    try:
        record = svc.repo.get(data.record_id)
        return GetInventoryItemOutput(status="success", data=record, meta={"entity": "inventory_item", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetInventoryItemOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetInventoryItemOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
