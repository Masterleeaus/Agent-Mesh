from typing import Optional
from pydantic import BaseModel, Field


class ValidateSessionInput(BaseModel):
    session_id: str = Field(description="Session UUID to validate.")


class ValidateSessionOutput(BaseModel):
    status: str = Field(description="Operation result: success or error.")
    user_id: Optional[str] = Field(default=None, description="User ID associated with the session.")
    valid: bool = Field(description="Whether the session is currently valid.")
    error: Optional[str] = Field(default=None, description="Error detail if validation failed.")
