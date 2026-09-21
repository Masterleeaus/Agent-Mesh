"""Generate missing CRUD function directories for ResQAI V2."""
import json
import os

FUNCTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "functions")

FUNCTIONS = [
    {
        "name": "delete_customer",
        "description": "Soft-deletes a customer record with audit logging.",
        "table": "customers_v2",
        "entity": "customer",
    },
    {
        "name": "list_customers",
        "description": "Lists customers with pagination, filtering, sorting, and search.",
        "table": "customers_v2",
        "entity": "customer",
    },
    {
        "name": "get_ticket",
        "description": "Retrieves a single ticket by ID with full details.",
        "table": "tickets_v2",
        "entity": "ticket",
    },
    {
        "name": "delete_ticket",
        "description": "Soft-deletes a ticket record with audit logging.",
        "table": "tickets_v2",
        "entity": "ticket",
    },
    {
        "name": "list_tickets",
        "description": "Lists tickets with pagination, filtering, sorting, and search.",
        "table": "tickets_v2",
        "entity": "ticket",
    },
    {
        "name": "get_technician",
        "description": "Retrieves a single technician by ID with skills.",
        "table": "technicians_v2",
        "entity": "technician",
    },
    {
        "name": "delete_technician",
        "description": "Soft-deletes a technician record with audit logging.",
        "table": "technicians_v2",
        "entity": "technician",
    },
    {
        "name": "delete_appointment",
        "description": "Soft-deletes an appointment record with audit logging.",
        "table": "appointments_v2",
        "entity": "appointment",
    },
    {
        "name": "delete_work_order",
        "description": "Soft-deletes a work order record with audit logging.",
        "table": "work_orders_v2",
        "entity": "work_order",
    },
    {
        "name": "get_account",
        "description": "Retrieves a single account by ID.",
        "table": "accounts_v2",
        "entity": "account",
    },
    {
        "name": "list_accounts",
        "description": "Lists accounts with pagination, filtering, sorting, and search.",
        "table": "accounts_v2",
        "entity": "account",
    },
    {
        "name": "get_inventory_item",
        "description": "Retrieves a single inventory item by ID.",
        "table": "inventory_items_v2",
        "entity": "inventory_item",
    },
    {
        "name": "delete_inventory_item",
        "description": "Soft-deletes an inventory item with audit logging.",
        "table": "inventory_items_v2",
        "entity": "inventory_item",
    },
    {
        "name": "create_dispute",
        "description": "Creates a new dispute record.",
        "table": "disputes_v2",
        "entity": "dispute",
    },
    {
        "name": "create_feedback",
        "description": "Creates a new feedback record.",
        "table": "feedback_v2",
        "entity": "feedback",
    },
    {
        "name": "list_feedback",
        "description": "Lists feedback records with pagination and filtering.",
        "table": "feedback_v2",
        "entity": "feedback",
    },
    {
        "name": "create_knowledge_article",
        "description": "Creates a new knowledge base article.",
        "table": "knowledge_articles_v2",
        "entity": "knowledge_article",
    },
    {
        "name": "list_knowledge_articles",
        "description": "Lists knowledge articles with pagination, filtering, and search.",
        "table": "knowledge_articles_v2",
        "entity": "knowledge_article",
    },
    {
        "name": "get_user",
        "description": "Retrieves a single user by ID.",
        "table": "users_v2",
        "entity": "user",
    },
    {
        "name": "delete_user",
        "description": "Soft-deletes a user record with audit logging.",
        "table": "users_v2",
        "entity": "user",
    },
    {
        "name": "get_role",
        "description": "Retrieves a single role by ID.",
        "table": "user_roles_v2",
        "entity": "role",
    },
    {
        "name": "delete_role",
        "description": "Soft-deletes a role record with audit logging.",
        "table": "user_roles_v2",
        "entity": "role",
    },
    {
        "name": "get_notification",
        "description": "Retrieves a single notification by ID.",
        "table": "notifications_v2",
        "entity": "notification",
    },
    {
        "name": "list_notifications",
        "description": "Lists notifications with pagination and filtering.",
        "table": "notifications_v2",
        "entity": "notification",
    },
]


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)


def generate_function(fn):
    name = fn["name"]
    table = fn["table"]
    entity = fn["entity"]
    dir_path = os.path.join(FUNCTIONS_DIR, name)
    os.makedirs(dir_path, exist_ok=True)
    for sub in ["src", "schemas", "tests"]:
        os.makedirs(os.path.join(dir_path, sub), exist_ok=True)

    display_name = name.replace("_", " ").title()
    entity_display = entity.replace("_", " ").title()

    # function.json
    fn_json = {
        "name": name,
        "description": fn["description"],
        "type": "API",
        "visibility": "POD",
        "python_packages": ["pydantic", "lemma-sdk"],
        "code": {"$file": "src/handler.py"},
        "permissions": {
            "grants": [
                {
                    "resource_type": "datastore_table",
                    "resource_name": table,
                    "permission_ids": ["datastore.record.read", "datastore.record.write"],
                },
                {
                    "resource_type": "datastore_table",
                    "resource_name": "audit_log_v2",
                    "permission_ids": ["datastore.record.read", "datastore.record.write"],
                },
                {
                    "resource_type": "datastore_table",
                    "resource_name": "events_v2",
                    "permission_ids": ["datastore.record.read", "datastore.record.write"],
                },
            ]
        },
    }
    write_file(os.path.join(dir_path, "function.json"), json.dumps(fn_json, indent=2))

    # src/__init__.py
    write_file(os.path.join(dir_path, "src", "__init__.py"), "")

    # Determine operation
    is_create = name.startswith("create_")
    is_get = name.startswith("get_")
    is_delete = name.startswith("delete_")
    is_list = name.startswith("list_")

    # schemas/input.json
    if is_create:
        input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": f"{display_name}Input",
            "type": "object",
            "properties": {
                "data": {"type": "object", "description": f"{entity_display} data"},
                "created_by": {"type": "string", "description": "Creator user ID"},
                "correlation_id": {"type": "string", "description": "Correlation ID for tracing"},
                "idempotency_key": {"type": "string", "description": "Idempotency key"},
            },
            "required": ["data"],
        }
    elif is_get or is_delete:
        input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": f"{display_name}Input",
            "type": "object",
            "properties": {
                "record_id": {"type": "string", "description": f"{entity_display} ID"},
                "actor_id": {"type": "string", "description": "Actor user ID"},
                "correlation_id": {"type": "string", "description": "Correlation ID for tracing"},
            },
            "required": ["record_id"],
        }
    elif is_list:
        input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": f"{display_name}Input",
            "type": "object",
            "properties": {
                "filters": {"type": "object", "description": "Filter conditions"},
                "sort_by": {"type": "string", "description": "Sort field"},
                "sort_dir": {"type": "string", "enum": ["asc", "desc"], "default": "desc"},
                "page": {"type": "integer", "minimum": 1, "default": 1},
                "page_size": {"type": "integer", "minimum": 1, "maximum": 200, "default": 20},
                "search": {"type": "string", "description": "Search query"},
                "search_fields": {"type": "array", "items": {"type": "string"}},
                "correlation_id": {"type": "string", "description": "Correlation ID for tracing"},
            },
        }

    write_file(os.path.join(dir_path, "schemas", "input.json"), json.dumps(input_schema, indent=2))

    # schemas/output.json
    output_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": f"{display_name}Output",
        "type": "object",
        "properties": {
            "status": {"type": "string", "enum": ["success", "error"]},
            "data": {"type": ["object", "array", "null"]},
            "error": {"type": ["object", "null"]},
            "pagination": {"type": ["object", "null"]},
            "meta": {"type": "object"},
        },
    }
    write_file(os.path.join(dir_path, "schemas", "output.json"), json.dumps(output_schema, indent=2))

    # src/models.py
    if is_create:
        models_code = f'''from typing import Any, Optional
from pydantic import BaseModel, Field


class {display_name.replace(' ', '')}Input(BaseModel):
    data: dict[str, Any] = Field(description="{entity_display} data")
    created_by: Optional[str] = Field(default=None, description="Creator user ID")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for safe retries")


class {display_name.replace(' ', '')}Output(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[dict[str, Any]] = Field(default=None, description="Created record")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
'''
    elif is_get or is_delete:
        models_code = f'''from typing import Any, Optional
from pydantic import BaseModel, Field


class {display_name.replace(' ', '')}Input(BaseModel):
    record_id: str = Field(description="{entity_display} ID")
    actor_id: Optional[str] = Field(default=None, description="Actor user ID")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")


class {display_name.replace(' ', '')}Output(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[Any] = Field(default=None, description="Response data")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
'''
    elif is_list:
        models_code = f'''from typing import Any, Optional
from pydantic import BaseModel, Field


class {display_name.replace(' ', '')}Input(BaseModel):
    filters: Optional[dict[str, Any]] = Field(default=None, description="Filter conditions")
    sort_by: Optional[str] = Field(default=None, description="Sort field")
    sort_dir: str = Field(default="desc", description="Sort direction: asc or desc")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=200, description="Items per page")
    search: Optional[str] = Field(default=None, description="Search query")
    search_fields: Optional[list[str]] = Field(default=None, description="Fields to search in")
    correlation_id: Optional[str] = Field(default=None, description="Correlation ID for tracing")


class {display_name.replace(' ', '')}Output(BaseModel):
    status: str = Field(description="success or error")
    data: Optional[list[dict[str, Any]]] = Field(default=None, description="List of records")
    error: Optional[dict[str, Any]] = Field(default=None, description="Error details")
    pagination: Optional[dict[str, Any]] = Field(default=None, description="Pagination info")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")
'''
    write_file(os.path.join(dir_path, "src", "models.py"), models_code)

    # src/handler.py
    input_model = f"{display_name.replace(' ', '')}Input"
    output_model = f"{display_name.replace(' ', '')}Output"

    if is_create:
        handler_code = f'''from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, ValidationError, utc_now
from src.models import {input_model}, {output_model}


async def {name}(ctx: FunctionContext, data: {input_model}) -> {output_model}:
    pod = Pod.from_env()
    svc = BaseService(pod, "{table}", "{entity_display}", correlation_id=data.correlation_id, function_name="{name}")

    try:
        payload = {{**data.data, "created_at": utc_now(), "updated_at": utc_now(), "version": 1}}
        if data.created_by:
            payload["created_by"] = data.created_by

        if data.idempotency_key:
            existing = svc.idempotency.check(data.idempotency_key, "{name}", data.data)
            if existing:
                return {output_model}(status="success", data=existing, meta={{"idempotent": True}})

        record = svc.repo.create(payload)
        svc.audit.log_create("{entity}", record.get("id", ""), record, actor_type="user", actor_id=data.created_by, correlation_id=data.correlation_id)

        if data.idempotency_key:
            svc.idempotency.record(data.idempotency_key, "{name}", data.data, record)

        return {output_model}(status="success", data=record, meta={{"entity": "{entity}", "correlation_id": data.correlation_id}})
    except ValidationError as e:
        return {output_model}(status="error", error=e.to_dict())
    except Exception as e:
        return {output_model}(status="error", error={{"code": "INTERNAL_ERROR", "message": str(e)}})
'''
    elif is_get:
        handler_code = f'''from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError
from src.models import {input_model}, {output_model}


async def {name}(ctx: FunctionContext, data: {input_model}) -> {output_model}:
    pod = Pod.from_env()
    svc = BaseService(pod, "{table}", "{entity_display}", correlation_id=data.correlation_id, function_name="{name}")

    try:
        record = svc.repo.get(data.record_id)
        return {output_model}(status="success", data=record, meta={{"entity": "{entity}", "correlation_id": data.correlation_id}})
    except NotFoundError as e:
        return {output_model}(status="error", error=e.to_dict())
    except Exception as e:
        return {output_model}(status="error", error={{"code": "INTERNAL_ERROR", "message": str(e)}})
'''
    elif is_delete:
        handler_code = f'''from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, NotFoundError, ValidationError
from src.models import {input_model}, {output_model}


async def {name}(ctx: FunctionContext, data: {input_model}) -> {output_model}:
    pod = Pod.from_env()
    svc = BaseService(pod, "{table}", "{entity_display}", correlation_id=data.correlation_id, function_name="{name}")

    try:
        existing = svc.repo.get(data.record_id)
        svc.repo.soft_delete(data.record_id, deleted_by=data.actor_id)
        svc.audit.log_delete("{entity}", data.record_id, existing, actor_type="user", actor_id=data.actor_id, correlation_id=data.correlation_id)
        return {output_model}(status="success", data={{"id": data.record_id, "deleted": True}}, meta={{"entity": "{entity}", "correlation_id": data.correlation_id}})
    except NotFoundError as e:
        return {output_model}(status="error", error=e.to_dict())
    except Exception as e:
        return {output_model}(status="error", error={{"code": "INTERNAL_ERROR", "message": str(e)}})
'''
    elif is_list:
        handler_code = f'''from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, FilterParam, PaginationParams, SearchParams, SortDirection, SortParams
from src.models import {input_model}, {output_model}


async def {name}(ctx: FunctionContext, data: {input_model}) -> {output_model}:
    pod = Pod.from_env()
    svc = BaseService(pod, "{table}", "{entity_display}", correlation_id=data.correlation_id, function_name="{name}")

    try:
        pagination = PaginationParams(page=data.page, page_size=data.page_size)
        sort_params = None
        if data.sort_by:
            sort_dir = SortDirection.ASC if data.sort_dir == "asc" else SortDirection.DESC
            sort_params = SortParams(sort_by=data.sort_by, sort_dir=sort_dir)

        filters = []
        if data.filters:
            for field, value in data.filters.items():
                filters.append(FilterParam(field=field, operator="eq", value=value))

        search_params = None
        if data.search:
            search_params = SearchParams(query=data.search, search_fields=data.search_fields)

        page = svc.repo.list(pagination=pagination, sort=sort_params, filters=filters if filters else None, search=search_params)
        return {output_model}(status="success", data=page.items, pagination=page.model_dump(), meta={{"entity": "{entity}", "correlation_id": data.correlation_id}})
    except Exception as e:
        return {output_model}(status="error", error={{"code": "INTERNAL_ERROR", "message": str(e)}})
'''
    write_file(os.path.join(dir_path, "src", "handler.py"), handler_code)

    # tests/__init__.py
    write_file(os.path.join(dir_path, "tests", "__init__.py"), "")

    print(f"  Generated {name}")


def main():
    print(f"Generating {len(FUNCTIONS)} CRUD functions in {FUNCTIONS_DIR}")
    for fn in FUNCTIONS:
        generate_function(fn)
    print("Done generating all CRUD functions.")


if __name__ == "__main__":
    main()
