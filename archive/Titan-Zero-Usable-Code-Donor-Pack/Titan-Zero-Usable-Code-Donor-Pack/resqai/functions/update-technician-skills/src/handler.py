#input_type_name: UpdateTechnicianSkillsInput
#output_type_name: UpdateTechnicianSkillsOutput
#function_name: update_technician_skills

from lemma_sdk import FunctionContext, Pod

from .models import UpdateTechnicianSkillsInput, UpdateTechnicianSkillsOutput


async def update_technician_skills(
    ctx: FunctionContext, data: UpdateTechnicianSkillsInput
) -> UpdateTechnicianSkillsOutput:
    pod = Pod.from_env()
    try:
        technician = pod.records.get("technicians", data.technician_id)
        if not technician:
            return UpdateTechnicianSkillsOutput(
                status="not_found",
                technician_id=data.technician_id,
                skills=[],
                error=f"Technician {data.technician_id} not found",
            )

        pod.records.update("technicians", data.technician_id, {
            "certification": data.skills,
        })

        skills_str = ", ".join(data.skills)
        pod.records.create("operations_log", {
            "action": "technician_skills_updated",
            "result": f"technician_id={data.technician_id}, skills=[{skills_str}]",
            "actor": "system",
        })

        return UpdateTechnicianSkillsOutput(
            status="success",
            technician_id=data.technician_id,
            skills=data.skills,
        )
    except Exception as e:
        return UpdateTechnicianSkillsOutput(
            status="error",
            technician_id=data.technician_id,
            skills=[],
            error=str(e),
        )
