from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import RecordAuditInput, RecordAuditOutput


async def record_audit(ctx: FunctionContext, data: RecordAuditInput) -> RecordAuditOutput:
    pod = Pod.from_env()

    record = pod.records.create("audit_log", {
        "entity_type": data.entity_type,
        "entity_id": data.entity_id,
        "action": data.action,
        "actor_type": data.actor_type,
        "actor_id": data.actor_id,
        "previous_state": data.previous_state,
        "new_state": data.new_state,
        "changed_fields": data.changed_fields or [],
        "ip_address": data.ip_address,
        "user_agent": data.user_agent,
        "correlation_id": data.correlation_id,
        "created_at": datetime.utcnow().isoformat(),
    })

    return RecordAuditOutput(status="success", audit_id=record.get("id"))
