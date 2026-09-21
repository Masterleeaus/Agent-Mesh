from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteAppointmentInput, DeleteAppointmentOutput


async def delete_appointment(ctx: FunctionContext, data: DeleteAppointmentInput) -> DeleteAppointmentOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "appointments_v2", "Appointment", correlation_id=data.correlation_id, function_name="delete_appointment")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("appointment", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteAppointmentOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "appointment", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteAppointmentOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteAppointmentOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
