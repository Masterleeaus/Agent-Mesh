#input_type_name: GetAppointmentInput
#output_type_name: GetAppointmentOutput
#function_name: get_appointment

from lemma_sdk import FunctionContext, Pod

from .models import AppointmentDetail, GetAppointmentInput, GetAppointmentOutput


async def get_appointment(
    ctx: FunctionContext, data: GetAppointmentInput
) -> GetAppointmentOutput:
    pod = Pod.from_env()
    try:
        record = pod.records.get("appointments", data.appointment_id)
        if not record:
            return GetAppointmentOutput(
                status="not_found",
                error=f"Appointment {data.appointment_id} not found",
            )

        appointment = AppointmentDetail(
            appointment_id=record["id"],
            customer_id=record.get("customer_id"),
            customer_name=record.get("customer_name"),
            technician_id=record.get("technician_id"),
            technician_name=record.get("technician_name"),
            service_type=record.get("service_type"),
            scheduled_date=record.get("scheduled_date"),
            status=record.get("status"),
            duration_minutes=record.get("duration_minutes"),
            notes=record.get("notes"),
            work_summary=record.get("work_summary"),
            completed_at=record.get("completed_at"),
            cancelled_at=record.get("cancelled_at"),
            cancellation_reason=record.get("cancellation_reason"),
            customer_signature=record.get("customer_signature"),
            created_by=record.get("created_by"),
            created_at=record.get("created_at"),
        )

        return GetAppointmentOutput(
            status="success",
            appointment=appointment,
        )
    except Exception as e:
        return GetAppointmentOutput(
            status="error",
            error=str(e),
        )
