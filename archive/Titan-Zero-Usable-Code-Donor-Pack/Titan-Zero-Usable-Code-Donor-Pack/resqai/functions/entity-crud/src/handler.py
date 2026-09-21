from lemma_sdk import FunctionContext, Pod

from functions.shared import (
    BaseService,
    FilterParam,
    NotFoundError,
    PaginationParams,
    SearchParams,
    SortDirection,
    SortParams,
    ValidationError,
    utc_now,
)
from src.models import ENTITY_MAP, EntityCrudInput, EntityCrudOutput, VALID_OPERATIONS


def _build_entity_type(entity: str) -> str:
    return entity.replace("_", " ").title()


async def entity_crud(ctx: FunctionContext, data: EntityCrudInput) -> EntityCrudOutput:
    pod = Pod.from_env()

    if data.entity not in ENTITY_MAP:
        return EntityCrudOutput(
            status="error",
            error={"code": "INVALID_ENTITY", "message": f"Unknown entity: {data.entity}", "details": {"valid_entities": list(ENTITY_MAP.keys())}},
        )

    if data.operation not in VALID_OPERATIONS:
        return EntityCrudOutput(
            status="error",
            error={"code": "INVALID_OPERATION", "message": f"Unknown operation: {data.operation}", "details": {"valid_operations": VALID_OPERATIONS}},
        )

    table = ENTITY_MAP[data.entity]
    entity_type = _build_entity_type(data.entity)
    svc = BaseService(pod, table, entity_type, correlation_id=data.correlation_id, function_name="entity_crud")

    try:
        if data.operation == "get":
            if not data.record_id:
                raise ValidationError("record_id is required for get operation")
            record = svc.repo.get(data.record_id)
            return EntityCrudOutput(status="success", data=record, meta={"entity": data.entity, "correlation_id": data.correlation_id})

        elif data.operation == "create":
            if not data.data:
                raise ValidationError("data is required for create operation")
            if data.idempotency_key:
                existing = svc.idempotency.check(data.idempotency_key, f"{data.entity}.create", data.data)
                if existing:
                    return EntityCrudOutput(status="success", data=existing, meta={"entity": data.entity, "idempotent": True, "correlation_id": data.correlation_id})
            record = svc.repo.create(data.data)
            svc.audit.log_create(
                entity_type=data.entity,
                entity_id=record.get("id", ""),
                state=record,
                actor_type=data.actor_type,
                actor_id=data.actor_id,
                correlation_id=data.correlation_id,
            )
            if data.idempotency_key:
                svc.idempotency.record(data.idempotency_key, f"{data.entity}.create", data.data, record)
            return EntityCrudOutput(status="success", data=record, meta={"entity": data.entity, "correlation_id": data.correlation_id})

        elif data.operation == "update":
            if not data.record_id:
                raise ValidationError("record_id is required for update operation")
            if not data.data:
                raise ValidationError("data is required for update operation")
            existing = svc.repo.get(data.record_id)
            updated = svc.repo.update(data.record_id, data.data, expected_version=data.expected_version)
            svc.audit.log_update(
                entity_type=data.entity,
                entity_id=data.record_id,
                previous_state=existing,
                new_state=updated,
                actor_type=data.actor_type,
                actor_id=data.actor_id,
                correlation_id=data.correlation_id,
            )
            return EntityCrudOutput(status="success", data=updated, meta={"entity": data.entity, "correlation_id": data.correlation_id})

        elif data.operation == "delete":
            if not data.record_id:
                raise ValidationError("record_id is required for delete operation")
            existing = svc.repo.get(data.record_id)
            deleted = svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
            svc.audit.log_delete(
                entity_type=data.entity,
                entity_id=data.record_id,
                state=existing,
                actor_type=data.actor_type,
                actor_id=data.actor_id,
                correlation_id=data.correlation_id,
            )
            return EntityCrudOutput(status="success", data={"id": data.record_id, "deleted": True}, meta={"entity": data.entity, "correlation_id": data.correlation_id})

        elif data.operation == "list":
            pagination = PaginationParams(page=data.pagination.page if data.pagination else 1, page_size=data.pagination.page_size if data.pagination else 20)
            sort_params = None
            if data.sort:
                sort_dir = SortDirection.ASC if data.sort.sort_dir == "asc" else SortDirection.DESC
                sort_params = SortParams(sort_by=data.sort.sort_by, sort_dir=sort_dir)
            filters = []
            if data.filters:
                filters = [FilterParam(field=f.field, operator=f.operator, value=f.value) for f in data.filters]
            search_params = None
            if data.search:
                search_params = SearchParams(query=data.search.query, search_fields=data.search.fields)
            page = svc.repo.list(pagination=pagination, sort=sort_params, filters=filters, search=search_params)
            return EntityCrudOutput(
                status="success",
                data=page.items,
                pagination=page.model_dump(),
                meta={"entity": data.entity, "correlation_id": data.correlation_id},
            )

        elif data.operation == "exists":
            if not data.record_id:
                raise ValidationError("record_id is required for exists operation")
            exists = svc.repo.exists(data.record_id)
            return EntityCrudOutput(status="success", data={"exists": exists}, meta={"entity": data.entity, "correlation_id": data.correlation_id})

    except NotFoundError as e:
        return EntityCrudOutput(status="error", error=e.to_dict(), meta={"entity": data.entity, "correlation_id": data.correlation_id})
    except ValidationError as e:
        return EntityCrudOutput(status="error", error=e.to_dict(), meta={"entity": data.entity, "correlation_id": data.correlation_id})
    except Exception as e:
        return EntityCrudOutput(
            status="error",
            error={"code": "INTERNAL_ERROR", "message": str(e), "details": {}},
            meta={"entity": data.entity, "correlation_id": data.correlation_id},
        )
