#input_type_name: CreateCustomerInput
#output_type_name: CreateCustomerOutput
#function_name: create_customer

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import CreateCustomerInput, CreateCustomerOutput


async def create_customer(ctx: FunctionContext, data: CreateCustomerInput) -> CreateCustomerOutput:
    pod = Pod.from_env()

    if not data.name or not data.name.strip():
        return CreateCustomerOutput(status="error", error="name is required")

    customer = pod.records.create("customers", {
        "name": data.name.strip(),
        "primary_phone": data.primary_phone,
        "primary_email": data.primary_email,
        "customer_type": data.customer_type,
        "timezone": data.timezone,
        "communication_prefs": data.communication_prefs or {},
        "notes": data.notes,
        "tags": data.tags or [],
        "created_by": data.created_by,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    account = pod.records.create("accounts", {
        "customer_id": customer["id"],
        "health": "healthy",
        "health_score": 1.0,
        "open_followups": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    pod.records.create("operations_log", {
        "action": "create_customer",
        "result": f"customer_id={customer['id']}, account_id={account['id']}",
        "actor": data.created_by or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return CreateCustomerOutput(status="success", customer_id=customer["id"])
