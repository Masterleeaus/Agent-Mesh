#input_type_name: ListAppointmentsInput
#output_type_name: ListAppointmentsOutput
#function_name: list_appointments

from lemma_sdk import FunctionContext, Pod

from .models import AppointmentItem, ListAppointmentsInput, ListAppointmentsOutput


async def list_appointments(
    ctx: FunctionContext, data: ListAppointmentsInput
) -> ListAppointmentsOutput:
    pod = Pod.from_env()
    try:
        filters = {}
        if data.status:
            filters["status"] = data.status
        if data.technician_id:
            filters["technician_id"] = data.technician_id
        if data.customer_id:
            filters["customer_id"] = data.customer_id
        if data.scheduled_date_from:
            filters["scheduled_date_from"] = data.scheduled_date_from.isoformat()
        if data.scheduled_date_to:
            filters["scheduled_date_to"] = data.scheduled_date_to.isoformat()

        limit = min(data.limit, 1000)
        records = pod.records.list(
            "appointments",
            filters=filters,
            limit=limit,
        )

        appointments = [
            AppointmentItem(
                appointment_id=r["id"],
                customer_id=r.get("customer_id", ""),
                customer_name=r.get("customer_name"),
                technician_id=r.get("technician_id"),
                technician_name=r.get("technician_name"),
                service_type=r.get("service_type", ""),
                scheduled_date=r.get("scheduled_date", ""),
                status=r.get("status", ""),
                duration_minutes=r.get("duration_minutes", 60),
                notes=r.get("notes"),
            )
            for r in records
        ]

        return ListAppointmentsOutput(
            total=len(appointments),
            appointments=appointments,
        )
    except Exception as e:
        return ListAppointmentsOutput(
            total=0,
            appointments=[],
        )
