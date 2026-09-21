from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, ValidationError, utc_now
from src.models import CreateKnowledgeArticleInput, CreateKnowledgeArticleOutput


async def create_knowledge_article(ctx: FunctionContext, data: CreateKnowledgeArticleInput) -> CreateKnowledgeArticleOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "knowledge_articles_v2", "Knowledge Article", correlation_id=data.correlation_id, function_name="create_knowledge_article")

    try:
        payload = {**data.data, "created_at": utc_now(), "updated_at": utc_now(), "version": 1}
        if data.created_by:
            payload["created_by"] = data.created_by

        if data.idempotency_key:
            existing = svc.idempotency.check(data.idempotency_key, "create_knowledge_article", data.data)
            if existing:
                return CreateKnowledgeArticleOutput(status="success", data=existing, meta={"idempotent": True})

        record = svc.repo.create(payload)
        svc.audit.log_create("knowledge_article", record.get("id", ""), record, actor_type="user", actor_id=data.created_by, correlation_id=data.correlation_id)

        if data.idempotency_key:
            svc.idempotency.record(data.idempotency_key, "create_knowledge_article", data.data, record)

        return CreateKnowledgeArticleOutput(status="success", data=record, meta={"entity": "knowledge_article", "correlation_id": data.correlation_id})
    except ValidationError as e:
        return CreateKnowledgeArticleOutput(status="error", error=e.to_dict())
    except Exception as e:
        return CreateKnowledgeArticleOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
