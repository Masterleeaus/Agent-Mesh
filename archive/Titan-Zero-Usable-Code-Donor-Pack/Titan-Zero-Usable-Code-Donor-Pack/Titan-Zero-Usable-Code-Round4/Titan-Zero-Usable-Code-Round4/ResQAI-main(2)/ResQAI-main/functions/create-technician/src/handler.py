#input_type_name: CreateTechnicianInput
#output_type_name: CreateTechnicianOutput
#function_name: create_technician

from lemma_sdk import FunctionContext, Pod

from .models import CreateTechnicianInput, CreateTechnicianOutput


async def create_technician(
    ctx: FunctionContext, data: CreateTechnicianInput
) -> CreateTechnicianOutput:
    pod = Pod.from_env()
    try:
        if not data.name or not data.name.strip():
            return CreateTechnicianOutput(
                status="error",
                error="Technician name is required",
            )

        record = pod.records.create("technicians", {
            "name": data.name.strip(),
            "primary_phone": data.primary_phone,
            "primary_email": data.primary_email,
            "timezone": data.timezone,
            "certification": data.certification or [],
            "max_daily_jobs": data.max_daily_jobs,
            "availability": "available",
            "status": "active",
            "notes": data.notes,
        })

        pod.records.create("operations_log", {
            "action": "technician_created",
            "result": f"technician_id={record['id']}, name={data.name}",
            "actor": data.created_by or "system",
        })

        return CreateTechnicianOutput(
            status="success",
            technician_id=record["id"],
        )
    except Exception as e:
        return CreateTechnicianOutput(
            status="error",
            error=str(e),
        )
