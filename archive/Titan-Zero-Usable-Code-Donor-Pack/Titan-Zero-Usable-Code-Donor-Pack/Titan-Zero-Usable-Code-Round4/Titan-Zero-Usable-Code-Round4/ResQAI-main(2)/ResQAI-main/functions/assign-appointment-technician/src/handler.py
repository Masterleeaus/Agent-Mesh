#input_type_name: AssignAppointmentTechnicianInput
#output_type_name: AssignAppointmentTechnicianOutput
#function_name: assign_appointment_technician

from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class AssignAppointmentTechnicianInput(BaseModel):
    appointment_id: str = Field(description="The appointment UUID to update.")
    technician_name: str = Field(description="Name of the technician to assign.")
    manager_notes: Optional[str] = Field(default=None, description="Notes from the approving manager.")
    technician_id: Optional[str] = Field(default=None, description="Technician UUID if known.")


class AssignAppointmentTechnicianOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    appointment_id: str = Field(description="The appointment UUID that was updated.")
    technician_name: str = Field(description="The technician assigned.")
    audit_logged: bool = Field(description="True if operations_log entry was written.")
    error: Optional[str] = Field(default=None, description="Error detail if the operation failed.")


async def assign_appointment_technician(
    ctx: FunctionContext, data: AssignAppointmentTechnicianInput
) -> AssignAppointmentTechnicianOutput:
    pod = Pod.from_env()
    try:
        appointment = pod.records.get("appointments", data.appointment_id)
        if not appointment:
            return AssignAppointmentTechnicianOutput(
                status="not_found",
                appointment_id=data.appointment_id,
                technician_name=data.technician_name,
                audit_logged=False,
                error=f"Appointment {data.appointment_id} not found",
            )

        updates = {"technician_id": data.technician_id, "status": "in_progress"}
        pod.records.update("appointments", data.appointment_id, updates)

        notes_suffix = f" | manager notes: {data.manager_notes}" if data.manager_notes else ""
        pod.records.create("operations_log", {
            "action": "appointment_technician_assigned",
            "result": f"appointment={data.appointment_id}, technician={data.technician_name}{notes_suffix}",
            "actor": "workflow:appointment-assignment",
        })

        return AssignAppointmentTechnicianOutput(
            status="success",
            appointment_id=data.appointment_id,
            technician_name=data.technician_name,
            audit_logged=True,
        )
    except Exception as e:
        return AssignAppointmentTechnicianOutput(
            status="error",
            appointment_id=data.appointment_id,
            technician_name=data.technician_name,
            audit_logged=False,
            error=str(e),
        )
