from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteTechnicianInput, DeleteTechnicianOutput


async def delete_technician(ctx: FunctionContext, data: DeleteTechnicianInput) -> DeleteTechnicianOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "technicians_v2", "Technician", correlation_id=data.correlation_id, function_name="delete_technician")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("technician", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteTechnicianOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "technician", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteTechnicianOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteTechnicianOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
