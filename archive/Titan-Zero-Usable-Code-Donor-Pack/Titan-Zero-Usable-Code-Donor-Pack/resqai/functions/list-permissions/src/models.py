from typing import Optional
from pydantic import BaseModel, Field


class ListPermissionsInput(BaseModel):
    role_id: Optional[str] = Field(default=None, description="Filter by role UUID.")
    resource: Optional[str] = Field(default=None, description="Filter by resource name.")
    limit: int = Field(default=200, description="Maximum number of permissions to return.")


class PermissionItem(BaseModel):
    permission_id: str = Field(description="Permission UUID.")
    role_id: str = Field(description="Role UUID.")
    role_name: str = Field(description="Display name of the role.")
    resource: str = Field(description="Resource name.")
    action: str = Field(description="Permission action.")
    scope: str = Field(description="Permission scope.")


class ListPermissionsOutput(BaseModel):
    total: int = Field(description="Total number of permissions matching filters.")
    permissions: list[PermissionItem] = Field(description="List of permission items.")
