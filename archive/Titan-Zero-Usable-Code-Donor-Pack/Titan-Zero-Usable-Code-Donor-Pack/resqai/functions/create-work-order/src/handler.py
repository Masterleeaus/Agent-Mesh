from src.models import CreateWorkOrderInput, CreateWorkOrderOutput
from lemma_sdk import FunctionContext, Pod
import uuid


async def create_work_order(ctx: FunctionContext, data: CreateWorkOrderInput) -> CreateWorkOrderOutput:
    pod = Pod.from_env()

    appointment = pod.records.get("appointments", data.appointment_id)
    if not appointment:
        return CreateWorkOrderOutput(
            status="not_found",
            error=f"Appointment {data.appointment_id} not found",
        )

    work_order_id = str(uuid.uuid4())
    now = str(ctx.now) if hasattr(ctx, "now") else None

    pod.records.create("work_orders", {
        "work_order_id": work_order_id,
        "appointment_id": data.appointment_id,
        "technician_id": data.technician_id,
        "customer_id": data.customer_id,
        "service_description": data.service_description,
        "customer_notes": data.customer_notes or "",
        "status": "created",
        "started_at": now,
        "created_by": data.created_by or "system",
    })

    pod.records.create("operations_log", {
        "action": "create_work_order",
        "result": f"work_order_id={work_order_id}, appointment_id={data.appointment_id}",
        "actor": data.created_by or "system",
    })

    return CreateWorkOrderOutput(
        status="success",
        work_order_id=work_order_id,
    )