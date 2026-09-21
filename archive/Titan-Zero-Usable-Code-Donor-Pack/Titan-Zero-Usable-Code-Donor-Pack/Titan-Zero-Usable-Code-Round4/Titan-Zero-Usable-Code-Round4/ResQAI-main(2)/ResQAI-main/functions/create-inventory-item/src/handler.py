from src.models import CreateInventoryItemInput, CreateInventoryItemOutput
from lemma_sdk import FunctionContext, Pod
import uuid


async def create_inventory_item(ctx: FunctionContext, data: CreateInventoryItemInput) -> CreateInventoryItemOutput:
    pod = Pod.from_env()

    existing = pod.records.list("inventory_items", filters={"sku": data.sku})
    if existing:
        return CreateInventoryItemOutput(
            status="conflict",
            error=f"SKU '{data.sku}' already exists",
        )

    item_id = str(uuid.uuid4())

    pod.records.create("inventory_items", {
        "item_id": item_id,
        "name": data.name,
        "sku": data.sku,
        "description": data.description or "",
        "category": data.category or "",
        "unit_price_cents": data.unit_price_cents,
        "quantity_on_hand": data.quantity_on_hand,
        "reorder_threshold": data.reorder_threshold,
        "reorder_quantity": data.reorder_quantity,
        "supplier_info": data.supplier_info or "",
        "created_by": data.created_by or "system",
    })

    pod.records.create("operations_log", {
        "action": "create_inventory_item",
        "result": f"item_id={item_id}, sku={data.sku}, name={data.name}",
        "actor": data.created_by or "system",
    })

    return CreateInventoryItemOutput(
        status="success",
        item_id=item_id,
    )