from typing import Optional
from pydantic import BaseModel, Field


class AssignUserRoleInput(BaseModel):
    user_id: str = Field(description="UUID of the user to assign the role to.")
    role_id: str = Field(description="UUID of the role to assign.")
    assigned_by: str = Field(description="User or system that performed the assignment.")


class AssignUserRoleOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    user_id: str = Field(description="Echoed user_id.")
    role_id: str = Field(description="Echoed role_id.")
    error: Optional[str] = Field(default=None, description="Error detail if assignment failed.")
