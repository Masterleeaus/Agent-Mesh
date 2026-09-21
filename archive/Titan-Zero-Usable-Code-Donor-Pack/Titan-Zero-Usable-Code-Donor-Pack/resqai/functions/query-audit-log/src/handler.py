from lemma_sdk import FunctionContext, Pod

from src.models import QueryAuditLogInput, QueryAuditLogOutput, AuditEntry


async def query_audit_log(ctx: FunctionContext, data: QueryAuditLogInput) -> QueryAuditLogOutput:
    pod = Pod.from_env()

    filters = {}
    if data.entity_type:
        filters["entity_type"] = data.entity_type
    if data.entity_id:
        filters["entity_id"] = data.entity_id
    if data.action:
        filters["action"] = data.action
    if data.actor_type:
        filters["actor_type"] = data.actor_type
    if data.actor_id:
        filters["actor_id"] = data.actor_id
    if data.correlation_id:
        filters["correlation_id"] = data.correlation_id
    if data.date_from:
        filters["date_from"] = data.date_from
    if data.date_to:
        filters["date_to"] = data.date_to

    records = pod.records.list("audit_log", filters, limit=data.limit, offset=data.offset, order_by="-created_at")

    entries = [
        AuditEntry(
            audit_id=r.get("id"),
            entity_type=r.get("entity_type", ""),
            entity_id=r.get("entity_id", ""),
            action=r.get("action", ""),
            actor_type=r.get("actor_type", ""),
            actor_id=r.get("actor_id"),
            previous_state=r.get("previous_state"),
            new_state=r.get("new_state"),
            changed_fields=r.get("changed_fields", []),
            ip_address=r.get("ip_address"),
            correlation_id=r.get("correlation_id"),
            created_at=r.get("created_at", ""),
        )
        for r in (records or [])
    ]

    return QueryAuditLogOutput(total=len(entries), entries=entries)
