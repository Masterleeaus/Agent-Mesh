from typing import Optional
from pydantic import BaseModel, Field


class CreateRoleInput(BaseModel):
    name: str = Field(description="Unique role name.")
    description: Optional[str] = Field(default=None, description="Role description.")
    is_system: bool = Field(default=False, description="Whether this is a system-managed role.")


class CreateRoleOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    role_id: Optional[str] = Field(default=None, description="UUID of the created role.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")
