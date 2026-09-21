#input_type_name: ListTechniciansInput
#output_type_name: ListTechniciansOutput
#function_name: list_technicians

from lemma_sdk import FunctionContext, Pod

from .models import ListTechniciansInput, ListTechniciansOutput, TechnicianItem


async def list_technicians(
    ctx: FunctionContext, data: ListTechniciansInput
) -> ListTechniciansOutput:
    pod = Pod.from_env()
    try:
        filters = {}
        if data.status:
            filters["status"] = data.status
        if data.availability:
            filters["availability"] = data.availability
        if data.min_rating is not None:
            filters["min_rating"] = data.min_rating

        limit = min(data.limit, 1000)
        records = pod.records.list(
            "technicians",
            filters=filters,
            limit=limit,
        )

        technicians = [
            TechnicianItem(
                technician_id=r["id"],
                name=r.get("name", ""),
                primary_phone=r.get("primary_phone"),
                primary_email=r.get("primary_email"),
                availability=r.get("availability"),
                status=r.get("status"),
                rating=r.get("rating"),
                current_jobs_count=r.get("current_jobs_count"),
                max_daily_jobs=r.get("max_daily_jobs"),
            )
            for r in records
        ]

        return ListTechniciansOutput(
            total=len(technicians),
            technicians=technicians,
        )
    except Exception as e:
        return ListTechniciansOutput(
            total=0,
            technicians=[],
        )
