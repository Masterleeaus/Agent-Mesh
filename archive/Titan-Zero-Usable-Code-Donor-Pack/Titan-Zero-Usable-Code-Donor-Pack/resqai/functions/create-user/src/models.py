from typing import Optional
from pydantic import BaseModel, Field


class CreateUserInput(BaseModel):
    email: str = Field(description="User email address.")
    name: str = Field(description="Display name of the user.")
    role_id: str = Field(description="Role UUID to assign.")
    auth_provider: Optional[str] = Field(default=None, description="External auth provider name.")
    auth_provider_id: Optional[str] = Field(default=None, description="External auth provider user ID.")
    preferences_config: Optional[dict] = Field(default=None, description="JSON preferences configuration.")
    created_by: Optional[str] = Field(default=None, description="User or system that created this user.")


class CreateUserOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    user_id: Optional[str] = Field(default=None, description="UUID of the created user.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")
