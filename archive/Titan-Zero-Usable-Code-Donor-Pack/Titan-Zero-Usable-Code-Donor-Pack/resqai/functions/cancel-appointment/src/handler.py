#input_type_name: CancelAppointmentInput
#output_type_name: CancelAppointmentOutput
#function_name: cancel_appointment

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from .models import CancelAppointmentInput, CancelAppointmentOutput


async def cancel_appointment(
    ctx: FunctionContext, data: CancelAppointmentInput
) -> CancelAppointmentOutput:
    pod = Pod.from_env()
    try:
        appointment = pod.records.get("appointments", data.appointment_id)
        if not appointment:
            return CancelAppointmentOutput(
                status="not_found",
                appointment_id=data.appointment_id,
                error=f"Appointment {data.appointment_id} not found",
            )

        now = datetime.now(timezone.utc).isoformat()
        pod.records.update("appointments", data.appointment_id, {
            "status": "cancelled",
            "cancelled_at": now,
            "cancellation_reason": data.cancellation_reason,
        })

        pod.records.create("operations_log", {
            "action": "appointment_cancelled",
            "result": f"appointment_id={data.appointment_id}, reason={data.cancellation_reason}",
            "actor": data.cancelled_by,
        })

        return CancelAppointmentOutput(
            status="success",
            appointment_id=data.appointment_id,
        )
    except Exception as e:
        return CancelAppointmentOutput(
            status="error",
            appointment_id=data.appointment_id,
            error=str(e),
        )
