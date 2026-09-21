from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetTicketInput, GetTicketOutput


async def get_ticket(ctx: FunctionContext, data: GetTicketInput) -> GetTicketOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "tickets_v2", "Ticket", correlation_id=data.correlation_id, function_name="get_ticket")

    try:
        record = svc.repo.get(data.record_id)
        return GetTicketOutput(status="success", data=record, meta={"entity": "ticket", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetTicketOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetTicketOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
