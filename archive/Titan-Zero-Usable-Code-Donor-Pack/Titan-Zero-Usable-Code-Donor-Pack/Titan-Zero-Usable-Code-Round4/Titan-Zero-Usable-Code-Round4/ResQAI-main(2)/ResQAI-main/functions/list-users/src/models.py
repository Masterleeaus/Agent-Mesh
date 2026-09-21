from typing import Optional
from pydantic import BaseModel, Field


class ListUsersInput(BaseModel):
    role_id: Optional[str] = Field(default=None, description="Filter by role UUID.")
    status: Optional[str] = Field(default=None, description="Filter by status (active, suspended, inactive).")
    limit: int = Field(default=100, description="Maximum number of users to return.")


class UserItem(BaseModel):
    user_id: str = Field(description="User UUID.")
    email: str = Field(description="User email address.")
    name: str = Field(description="User display name.")
    role_id: str = Field(description="Assigned role UUID.")
    status: str = Field(description="User status.")
    last_login_at: Optional[str] = Field(default=None, description="Last login timestamp.")
    created_at: str = Field(description="Account creation timestamp.")


class ListUsersOutput(BaseModel):
    total: int = Field(description="Total number of users matching filters.")
    users: list[UserItem] = Field(description="List of user items.")
