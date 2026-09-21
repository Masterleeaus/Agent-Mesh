#input_type_name: CreateAppointmentInput
#output_type_name: CreateAppointmentOutput
#function_name: create_appointment

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from .models import CreateAppointmentInput, CreateAppointmentOutput


async def create_appointment(
    ctx: FunctionContext, data: CreateAppointmentInput
) -> CreateAppointmentOutput:
    pod = Pod.from_env()
    try:
        customer = pod.records.get("customers", data.customer_id)
        if not customer:
            return CreateAppointmentOutput(
                status="error",
                error=f"Customer {data.customer_id} not found",
            )

        record = pod.records.create("appointments", {
            "customer_id": data.customer_id,
            "service_type": data.service_type,
            "scheduled_date": data.scheduled_date,
            "duration_minutes": data.duration_minutes,
            "status": "scheduled",
            "notes": data.notes,
            "created_by": data.created_by or "system",
        })

        pod.records.create("operations_log", {
            "action": "appointment_created",
            "result": f"appointment_id={record['id']}, customer={data.customer_id}, service={data.service_type}",
            "actor": data.created_by or "system",
        })

        return CreateAppointmentOutput(
            status="success",
            appointment_id=record["id"],
        )
    except Exception as e:
        return CreateAppointmentOutput(
            status="error",
            error=str(e),
        )
