from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import GetNotificationInput, GetNotificationOutput


async def get_notification(ctx: FunctionContext, data: GetNotificationInput) -> GetNotificationOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "notifications_v2", "Notification", correlation_id=data.correlation_id, function_name="get_notification")

    try:
        record = svc.repo.get(data.record_id)
        return GetNotificationOutput(status="success", data=record, meta={"entity": "notification", "correlation_id": data.correlation_id})
    except NotFoundError as e:
        return GetNotificationOutput(status="error", error=e.to_dict())
    except Exception as e:
        return GetNotificationOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
