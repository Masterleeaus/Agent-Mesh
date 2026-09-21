#input_type_name: UpdateTechnicianInput
#output_type_name: UpdateTechnicianOutput
#function_name: update_technician

from lemma_sdk import FunctionContext, Pod

from .models import UpdateTechnicianInput, UpdateTechnicianOutput


async def update_technician(
    ctx: FunctionContext, data: UpdateTechnicianInput
) -> UpdateTechnicianOutput:
    pod = Pod.from_env()
    try:
        technician = pod.records.get("technicians", data.technician_id)
        if not technician:
            return UpdateTechnicianOutput(
                status="not_found",
                technician_id=data.technician_id,
                error=f"Technician {data.technician_id} not found",
            )

        updates = {}
        if data.name is not None:
            updates["name"] = data.name
        if data.primary_phone is not None:
            updates["primary_phone"] = data.primary_phone
        if data.primary_email is not None:
            updates["primary_email"] = data.primary_email
        if data.status is not None:
            updates["status"] = data.status
        if data.notes is not None:
            updates["notes"] = data.notes
        if data.max_daily_jobs is not None:
            updates["max_daily_jobs"] = data.max_daily_jobs

        if updates:
            pod.records.update("technicians", data.technician_id, updates)

        updated_fields = ", ".join(updates.keys()) if updates else "none"
        pod.records.create("operations_log", {
            "action": "technician_updated",
            "result": f"technician_id={data.technician_id}, fields={updated_fields}",
            "actor": data.updated_by or "system",
        })

        return UpdateTechnicianOutput(
            status="success",
            technician_id=data.technician_id,
        )
    except Exception as e:
        return UpdateTechnicianOutput(
            status="error",
            technician_id=data.technician_id,
            error=str(e),
        )
