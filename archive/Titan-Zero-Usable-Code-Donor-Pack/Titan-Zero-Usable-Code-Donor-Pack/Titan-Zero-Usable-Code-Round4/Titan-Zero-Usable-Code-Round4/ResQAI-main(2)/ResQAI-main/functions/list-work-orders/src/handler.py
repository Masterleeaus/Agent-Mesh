from src.models import ListWorkOrdersInput, ListWorkOrdersOutput, WorkOrderItem
from lemma_sdk import FunctionContext, Pod


async def list_work_orders(ctx: FunctionContext, data: ListWorkOrdersInput) -> ListWorkOrdersOutput:
    pod = Pod.from_env()

    filters = {}
    if data.technician_id:
        filters["technician_id"] = data.technician_id
    if data.status:
        filters["status"] = data.status
    if data.appointment_id:
        filters["appointment_id"] = data.appointment_id

    work_orders = pod.records.list("work_orders", filters=filters, limit=data.limit)

    items = [
        WorkOrderItem(
            work_order_id=wo.get("work_order_id", ""),
            appointment_id=wo.get("appointment_id", ""),
            technician_id=wo.get("technician_id", ""),
            customer_id=wo.get("customer_id", ""),
            status=wo.get("status", ""),
            service_description=wo.get("service_description", ""),
            started_at=wo.get("started_at"),
            completed_at=wo.get("completed_at"),
            parts_used=wo.get("parts_used"),
            photos=wo.get("photos"),
        )
        for wo in work_orders
    ]

    return ListWorkOrdersOutput(
        total=len(items),
        work_orders=items,
    )