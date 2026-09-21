from lemma_sdk import FunctionContext, Pod

from src.models import ListPermissionsInput, ListPermissionsOutput, PermissionItem


async def list_permissions(ctx: FunctionContext, data: ListPermissionsInput) -> ListPermissionsOutput:
    pod = Pod.from_env()

    filters = {}
    if data.role_id:
        filters["role_id"] = data.role_id
    if data.resource:
        filters["resource"] = data.resource

    records = pod.records.list("role_permissions", filters, limit=data.limit)

    roles_cache = {}
    def get_role_name(role_id):
        if role_id not in roles_cache:
            role = pod.records.get("user_roles", role_id)
            roles_cache[role_id] = role.get("name", role_id) if role else role_id
        return roles_cache[role_id]

    permissions = [
        PermissionItem(
            permission_id=r.get("id"),
            role_id=r.get("role_id", ""),
            role_name=get_role_name(r.get("role_id", "")),
            resource=r.get("resource", ""),
            action=r.get("action", ""),
            scope=r.get("scope", "own"),
        )
        for r in (records or [])
    ]

    return ListPermissionsOutput(total=len(permissions), permissions=permissions)
