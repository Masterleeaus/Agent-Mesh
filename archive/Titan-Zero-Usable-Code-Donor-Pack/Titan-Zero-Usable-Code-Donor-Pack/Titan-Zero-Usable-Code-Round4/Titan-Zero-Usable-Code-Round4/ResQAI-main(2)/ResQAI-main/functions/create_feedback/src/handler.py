from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, ValidationError, utc_now
from src.models import CreateFeedbackInput, CreateFeedbackOutput


async def create_feedback(ctx: FunctionContext, data: CreateFeedbackInput) -> CreateFeedbackOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "feedback_v2", "Feedback", correlation_id=data.correlation_id, function_name="create_feedback")

    try:
        payload = {**data.data, "created_at": utc_now(), "updated_at": utc_now(), "version": 1}
        if data.created_by:
            payload["created_by"] = data.created_by

        if data.idempotency_key:
            existing = svc.idempotency.check(data.idempotency_key, "create_feedback", data.data)
            if existing:
                return CreateFeedbackOutput(status="success", data=existing, meta={"idempotent": True})

        record = svc.repo.create(payload)
        svc.audit.log_create("feedback", record.get("id", ""), record, actor_type="user", actor_id=data.created_by, correlation_id=data.correlation_id)

        if data.idempotency_key:
            svc.idempotency.record(data.idempotency_key, "create_feedback", data.data, record)

        return CreateFeedbackOutput(status="success", data=record, meta={"entity": "feedback", "correlation_id": data.correlation_id})
    except ValidationError as e:
        return CreateFeedbackOutput(status="error", error=e.to_dict())
    except Exception as e:
        return CreateFeedbackOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
