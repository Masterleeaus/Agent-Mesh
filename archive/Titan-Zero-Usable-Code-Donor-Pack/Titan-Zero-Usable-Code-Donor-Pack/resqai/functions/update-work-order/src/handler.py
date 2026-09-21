from src.models import UpdateWorkOrderInput, UpdateWorkOrderOutput
from lemma_sdk import FunctionContext, Pod
from datetime import datetime, timezone


async def update_work_order(ctx: FunctionContext, data: UpdateWorkOrderInput) -> UpdateWorkOrderOutput:
    pod = Pod.from_env()

    work_order = pod.records.get("work_orders", data.work_order_id)
    if not work_order:
        return UpdateWorkOrderOutput(
            status="not_found",
            work_order_id=data.work_order_id,
            error=f"Work order {data.work_order_id} not found",
        )

    updates = {}

    if data.status is not None:
        updates["status"] = data.status
        if data.status == "completed":
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
    if data.technician_notes is not None:
        updates["technician_notes"] = data.technician_notes
    if data.parts_used is not None:
        updates["parts_used"] = data.parts_used
    if data.photos is not None:
        updates["photos"] = data.photos
    if data.signature_ref is not None:
        updates["signature_ref"] = data.signature_ref

    if not updates:
        return UpdateWorkOrderOutput(
            status="success",
            work_order_id=data.work_order_id,
        )

    pod.records.update("work_orders", data.work_order_id, updates)

    pod.records.create("operations_log", {
        "action": "update_work_order",
        "result": f"work_order_id={data.work_order_id}, fields={list(updates.keys())}",
        "actor": data.updated_by or "system",
    })

    return UpdateWorkOrderOutput(
        status="success",
        work_order_id=data.work_order_id,
    )