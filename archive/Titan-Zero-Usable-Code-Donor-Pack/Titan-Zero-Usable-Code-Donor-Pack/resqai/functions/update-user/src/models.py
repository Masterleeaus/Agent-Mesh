from typing import Optional
from pydantic import BaseModel, Field


class UpdateUserInput(BaseModel):
    user_id: str = Field(description="UUID of the user to update.")
    name: Optional[str] = Field(default=None, description="New display name.")
    email: Optional[str] = Field(default=None, description="New email address.")
    role_id: Optional[str] = Field(default=None, description="New role UUID.")
    status: Optional[str] = Field(default=None, description="New status (active, suspended, inactive).")
    preferences_config: Optional[dict] = Field(default=None, description="Updated preferences configuration.")
    updated_by: Optional[str] = Field(default=None, description="User or system that performed the update.")


class UpdateUserOutput(BaseModel):
    status: str = Field(description="Operation result: success, not_found, or error.")
    user_id: str = Field(description="Echoed user_id of the updated user.")
    error: Optional[str] = Field(default=None, description="Error detail if update failed.")
