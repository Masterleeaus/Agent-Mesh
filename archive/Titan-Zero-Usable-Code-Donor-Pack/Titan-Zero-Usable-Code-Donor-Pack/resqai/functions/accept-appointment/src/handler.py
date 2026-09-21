#input_type_name: AcceptAppointmentInput
#output_type_name: AcceptAppointmentOutput
#function_name: accept_appointment

from lemma_sdk import FunctionContext, Pod

from .models import AcceptAppointmentInput, AcceptAppointmentOutput


async def accept_appointment(
    ctx: FunctionContext, data: AcceptAppointmentInput
) -> AcceptAppointmentOutput:
    pod = Pod.from_env()
    try:
        appointment = pod.records.get("appointments", data.appointment_id)
        if not appointment:
            return AcceptAppointmentOutput(
                status="not_found",
                appointment_id=data.appointment_id,
                technician_id=data.technician_id,
                error=f"Appointment {data.appointment_id} not found",
            )

        if not appointment.get("technician_id"):
            return AcceptAppointmentOutput(
                status="error",
                appointment_id=data.appointment_id,
                technician_id=data.technician_id,
                error="Appointment has no technician assigned",
            )

        pod.records.update("appointments", data.appointment_id, {"status": "accepted"})

        notes_suffix = f" | notes: {data.notes}" if data.notes else ""
        pod.records.create("operations_log", {
            "action": "appointment_accepted",
            "result": f"appointment_id={data.appointment_id}, technician={data.technician_name}{notes_suffix}",
            "actor": f"technician:{data.technician_id}",
        })

        return AcceptAppointmentOutput(
            status="success",
            appointment_id=data.appointment_id,
            technician_id=data.technician_id,
        )
    except Exception as e:
        return AcceptAppointmentOutput(
            status="error",
            appointment_id=data.appointment_id,
            technician_id=data.technician_id,
            error=str(e),
        )
