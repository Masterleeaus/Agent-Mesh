from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetTechnicianInput, GetTechnicianOutput


async def get_technician(ctx: FunctionContext, data: GetTechnicianInput) -> GetTechnicianOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "technicians_v2", "Technician", correlation_id=data.correlation_id, function_name="get_technician")

    try:
        record = svc.repo.get(data.record_id)
        return GetTechnicianOutput(status="success", data=record, meta={"entity": "technician", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetTechnicianOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetTechnicianOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
