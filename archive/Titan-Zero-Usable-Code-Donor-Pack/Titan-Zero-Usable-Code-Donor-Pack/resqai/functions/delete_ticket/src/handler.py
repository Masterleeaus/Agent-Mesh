from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import DeleteTicketInput, DeleteTicketOutput


async def delete_ticket(ctx: FunctionContext, data: DeleteTicketInput) -> DeleteTicketOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "tickets_v2", "Ticket", correlation_id=data.correlation_id, function_name="delete_ticket")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("ticket", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return DeleteTicketOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": "ticket", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return DeleteTicketOutput(status="error", error=e.to_dict())
    except Exception as e:
        return DeleteTicketOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
