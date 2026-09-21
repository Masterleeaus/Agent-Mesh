#input_type_name: CompleteAppointmentInput
#output_type_name: CompleteAppointmentOutput
#function_name: complete_appointment

from datetime import datetime, timezone

from lemma_sdk import FunctionContext, Pod

from .models import CompleteAppointmentInput, CompleteAppointmentOutput


async def complete_appointment(
    ctx: FunctionContext, data: CompleteAppointmentInput
) -> CompleteAppointmentOutput:
    pod = Pod.from_env()
    try:
        appointment = pod.records.get("appointments", data.appointment_id)
        if not appointment:
            return CompleteAppointmentOutput(
                status="not_found",
                appointment_id=data.appointment_id,
                error=f"Appointment {data.appointment_id} not found",
            )

        if appointment.get("status") == "completed":
            return CompleteAppointmentOutput(
                status="error",
                appointment_id=data.appointment_id,
                error=f"Appointment {data.appointment_id} is already completed",
            )

        now = datetime.now(timezone.utc).isoformat()
        updates = {
            "status": "completed",
            "completed_at": now,
        }
        if data.work_summary:
            updates["work_summary"] = data.work_summary
        if data.customer_signature:
            updates["customer_signature"] = data.customer_signature

        pod.records.update("appointments", data.appointment_id, updates)

        if data.parts_used:
            for part in data.parts_used:
                pod.records.create("inventory_transactions", {
                    "appointment_id": data.appointment_id,
                    "part_name": part.part_name,
                    "quantity": part.quantity,
                    "part_number": part.part_number,
                    "transaction_type": "usage",
                    "created_at": now,
                })

        parts_summary = f", parts={len(data.parts_used)}" if data.parts_used else ""
        pod.records.create("operations_log", {
            "action": "appointment_completed",
            "result": f"appointment_id={data.appointment_id}, completed_by={data.completed_by}{parts_summary}",
            "actor": data.completed_by,
        })

        return CompleteAppointmentOutput(
            status="success",
            appointment_id=data.appointment_id,
        )
    except Exception as e:
        return CompleteAppointmentOutput(
            status="error",
            appointment_id=data.appointment_id,
            error=str(e),
        )
