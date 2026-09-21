from src.models import UpdateInventoryItemInput, UpdateInventoryItemOutput
from lemma_sdk import FunctionContext, Pod


async def update_inventory_item(ctx: FunctionContext, data: UpdateInventoryItemInput) -> UpdateInventoryItemOutput:
    pod = Pod.from_env()

    item = pod.records.get("inventory_items", data.item_id)
    if not item:
        return UpdateInventoryItemOutput(
            status="not_found",
            item_id=data.item_id,
            error=f"Inventory item {data.item_id} not found",
        )

    updates = {}

    if data.name is not None:
        updates["name"] = data.name
    if data.description is not None:
        updates["description"] = data.description
    if data.category is not None:
        updates["category"] = data.category
    if data.unit_price_cents is not None:
        updates["unit_price_cents"] = data.unit_price_cents
    if data.reorder_threshold is not None:
        updates["reorder_threshold"] = data.reorder_threshold
    if data.reorder_quantity is not None:
        updates["reorder_quantity"] = data.reorder_quantity
    if data.supplier_info is not None:
        updates["supplier_info"] = data.supplier_info

    if data.quantity_on_hand is not None:
        old_qty = item.get("quantity_on_hand", 0)
        change = data.quantity_on_hand - old_qty
        updates["quantity_on_hand"] = data.quantity_on_hand

        pod.records.create("inventory_transactions", {
            "item_id": data.item_id,
            "previous_quantity": old_qty,
            "new_quantity": data.quantity_on_hand,
            "change": change,
            "reason": "manual_update",
            "actor": data.updated_by or "system",
        })

    if not updates:
        return UpdateInventoryItemOutput(
            status="success",
            item_id=data.item_id,
        )

    pod.records.update("inventory_items", data.item_id, updates)

    pod.records.create("operations_log", {
        "action": "update_inventory_item",
        "result": f"item_id={data.item_id}, fields={list(updates.keys())}",
        "actor": data.updated_by or "system",
    })

    return UpdateInventoryItemOutput(
        status="success",
        item_id=data.item_id,
    )