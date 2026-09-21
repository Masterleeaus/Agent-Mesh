from typing import Optional
from pydantic import BaseModel, Field


class AuthenticateUserInput(BaseModel):
    email: str = Field(description="User email address.")
    password: Optional[str] = Field(default=None, description="Plain-text password for legacy auth.")
    auth_provider: Optional[str] = Field(default=None, description="OAuth provider name (e.g. google, microsoft).")
    auth_provider_id: Optional[str] = Field(default=None, description="User ID from the external auth provider.")


class AuthenticateUserOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    user_id: Optional[str] = Field(default=None, description="Authenticated user UUID.")
    name: Optional[str] = Field(default=None, description="Display name of the authenticated user.")
    email: Optional[str] = Field(default=None, description="Email of the authenticated user.")
    role: Optional[str] = Field(default=None, description="Role ID assigned to the user.")
    token: Optional[str] = Field(default=None, description="Session token (session UUID) for subsequent requests.")
    error: Optional[str] = Field(default=None, description="Error detail if authentication failed.")
