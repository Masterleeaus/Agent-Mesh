"""
Pydantic models for Platform Auth Service

Defines request/response models with validation for the auth service API.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, Literal
from datetime import datetime
from enum import Enum


class AuthType(str, Enum):
    """Supported authentication types."""
    OAUTH2_CLIENT_CREDENTIALS = "oauth2_client_credentials"
    API_KEY = "api_key"
    BASIC_AUTH = "basic_auth"


class CredentialCreate(BaseModel):
    """Model for creating new credentials."""
    workspace_id: str = Field(..., description="Workspace identifier")
    connector_id: str = Field(..., description="Connector identifier") 
    auth_type: AuthType = Field(..., description="Authentication method")
    credential_data: Dict[str, Any] = Field(..., description="Encrypted credential data")
    
    @validator('workspace_id', 'connector_id')
    def validate_ids(cls, v):
        if not v or not v.strip():
            raise ValueError('IDs cannot be empty')
        if len(v) > 255:
            raise ValueError('IDs cannot exceed 255 characters')
        return v.strip()
    
    @validator('credential_data')
    def validate_credential_data(cls, v, values):
        """Validate credential data based on auth type."""
        auth_type = values.get('auth_type')
        
        if auth_type == AuthType.OAUTH2_CLIENT_CREDENTIALS:
            required_fields = ['client_id', 'client_secret', 'token_url']
            for field in required_fields:
                if field not in v:
                    raise ValueError(f'Missing required field for OAuth2: {field}')
        
        elif auth_type == AuthType.API_KEY:
            if 'api_key' not in v:
                raise ValueError('Missing required field for API key: api_key')
        
        elif auth_type == AuthType.BASIC_AUTH:
            required_fields = ['username', 'password']
            for field in required_fields:
                if field not in v:
                    raise ValueError(f'Missing required field for Basic Auth: {field}')
        
        return v


class CredentialResponse(BaseModel):
    """Model for credential response."""
    workspace_id: str
    connector_id: str
    auth_type: AuthType
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TokenRequest(BaseModel):
    """Model for token request."""
    workspace_id: str = Field(..., description="Workspace identifier")
    connector_id: str = Field(..., description="Connector identifier")


class TokenResponse(BaseModel):
    """Model for token response."""
    access_token: str = Field(..., description="Access token")
    token_type: str = Field(default="Bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")
    cached: bool = Field(default=False, description="Whether token was served from cache")
    scope: Optional[str] = Field(default=None, description="Token scope")


class HealthResponse(BaseModel):
    """Model for health check response."""
    status: Literal["healthy", "unhealthy"] = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Model for error responses."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")


# Internal models for database operations
class StoredCredential(BaseModel):
    """Model for stored credential data."""
    id: Optional[int] = None
    workspace_id: str
    connector_id: str
    auth_type: str
    encrypted_data: bytes
    created_at: datetime
    updated_at: datetime


class CachedToken(BaseModel):
    """Model for cached token data."""
    workspace_id: str
    connector_id: str
    access_token: str
    expires_at: datetime
    scope: Optional[str] = None