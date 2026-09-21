from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import ManagePermissionInput, ManagePermissionOutput


async def manage_permission(ctx: FunctionContext, data: ManagePermissionInput) -> ManagePermissionOutput:
    pod = Pod.from_env()

    if data.action == "grant":
        existing = pod.records.list("role_permissions", {
            "role_id": data.role_id,
            "resource": data.resource,
            "action": data.permission_action,
        })
        if not existing:
            pod.records.create("role_permissions", {
                "role_id": data.role_id,
                "resource": data.resource,
                "action": data.permission_action,
                "scope": data.scope,
                "created_at": datetime.utcnow().isoformat(),
            })
        action_label = "granted"
    else:
        existing = pod.records.list("role_permissions", {
            "role_id": data.role_id,
            "resource": data.resource,
            "action": data.permission_action,
        })
        for perm in (existing or []):
            pod.records.delete("role_permissions", perm.get("id"))
        action_label = "revoked"

    pod.records.create("operations_log", {
        "action": f"permission {action_label}",
        "result": f"role_id={data.role_id}, resource={data.resource}, action={data.permission_action}, scope={data.scope}",
        "actor": "system",
    })

    return ManagePermissionOutput(
        status="success",
        role_id=data.role_id,
        resource=data.resource,
        permission_action=data.permission_action,
    )
