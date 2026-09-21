from typing import Literal, Optional
from pydantic import BaseModel, Field


class ManagePermissionInput(BaseModel):
    action: Literal["grant", "revoke"] = Field(description="Whether to grant or revoke the permission.")
    role_id: str = Field(description="UUID of the role.")
    resource: str = Field(description="Resource name (e.g. tickets, users_v2).")
    permission_action: str = Field(description="Permission action (e.g. datastore.record.read).")
    scope: str = Field(default="own", description="Scope of the permission (own, department, all).")


class ManagePermissionOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    role_id: str = Field(description="Echoed role_id.")
    resource: str = Field(description="Echoed resource name.")
    permission_action: str = Field(description="Echoed permission action.")
    error: Optional[str] = Field(default=None, description="Error detail if operation failed.")
