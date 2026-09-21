from src.models import ListInventoryInput, ListInventoryOutput, InventoryItem
from lemma_sdk import FunctionContext, Pod


async def list_inventory(ctx: FunctionContext, data: ListInventoryInput) -> ListInventoryOutput:
    pod = Pod.from_env()

    filters = {}
    if data.category:
        filters["category"] = data.category

    items = pod.records.list("inventory_items", filters=filters, limit=data.limit)

    result_items = []
    for item in items:
        if data.low_stock_only:
            qty = item.get("quantity_on_hand", 0)
            threshold = item.get("reorder_threshold", 0)
            if qty >= threshold:
                continue

        result_items.append(InventoryItem(
            item_id=item.get("item_id", ""),
            name=item.get("name", ""),
            sku=item.get("sku", ""),
            category=item.get("category"),
            quantity_on_hand=item.get("quantity_on_hand", 0),
            reorder_threshold=item.get("reorder_threshold", 0),
            unit_price_cents=item.get("unit_price_cents", 0),
            supplier_info=item.get("supplier_info"),
        ))

    return ListInventoryOutput(
        total=len(result_items),
        items=result_items,
    )