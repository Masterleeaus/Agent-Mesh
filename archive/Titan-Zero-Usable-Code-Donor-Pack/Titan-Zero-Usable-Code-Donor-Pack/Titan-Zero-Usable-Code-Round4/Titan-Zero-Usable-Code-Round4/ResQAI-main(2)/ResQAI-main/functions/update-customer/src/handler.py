#input_type_name: UpdateCustomerInput
#output_type_name: UpdateCustomerOutput
#function_name: update_customer

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import UpdateCustomerInput, UpdateCustomerOutput


async def update_customer(ctx: FunctionContext, data: UpdateCustomerInput) -> UpdateCustomerOutput:
    pod = Pod.from_env()

    customer = pod.records.get("customers", data.customer_id)
    if not customer:
        return UpdateCustomerOutput(
            status="error",
            customer_id=data.customer_id,
            error=f"Customer {data.customer_id} not found",
        )

    updates = {}
    for field in ("name", "primary_phone", "primary_email", "status", "customer_type", "timezone", "communication_prefs", "notes", "tags"):
        value = getattr(data, field, None)
        if value is not None:
            updates[field] = value
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    pod.records.update("customers", data.customer_id, updates)

    pod.records.create("operations_log", {
        "action": "update_customer",
        "result": f"customer_id={data.customer_id}, fields={list(updates.keys())}",
        "actor": data.updated_by or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return UpdateCustomerOutput(status="success", customer_id=data.customer_id)
