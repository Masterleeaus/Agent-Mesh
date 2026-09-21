from lemma_sdk import FunctionContext, Pod

from src.models import ListUsersInput, ListUsersOutput, UserItem


async def list_users(ctx: FunctionContext, data: ListUsersInput) -> ListUsersOutput:
    pod = Pod.from_env()

    filters = {}
    if data.role_id:
        filters["role_id"] = data.role_id
    if data.status:
        filters["status"] = data.status

    records = pod.records.list("users", filters, limit=data.limit)
    users = [
        UserItem(
            user_id=r.get("id"),
            email=r.get("email", ""),
            name=r.get("name", ""),
            role_id=r.get("role_id", ""),
            status=r.get("status", ""),
            last_login_at=r.get("last_login_at"),
            created_at=r.get("created_at", ""),
        )
        for r in (records or [])
    ]

    return ListUsersOutput(total=len(users), users=users)
