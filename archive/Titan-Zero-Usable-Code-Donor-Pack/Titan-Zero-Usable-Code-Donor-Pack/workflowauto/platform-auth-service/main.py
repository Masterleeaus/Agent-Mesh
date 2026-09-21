"""
Platform Auth Service - Main Application

Provides secure credential storage and token management for the Aspire Platform.
Implements OAuth2 client credentials flow with encrypted credential storage.
"""

from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import logging

from config import get_settings
from models import (
    CredentialCreate,
    CredentialResponse,
    TokenResponse,
    HealthResponse
)
from services.credential_store import CredentialStore
from services.token_cache import TokenCache
from services.oauth_client import OAuth2Client
from auth import verify_internal_api_key

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Platform Auth Service",
    description="Secure credential storage and token management for Aspire Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
credential_store: Optional[CredentialStore] = None
token_cache: Optional[TokenCache] = None
oauth_client: Optional[OAuth2Client] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup."""
    global credential_store, token_cache, oauth_client
    
    settings = get_settings()
    logger.info("Starting Platform Auth Service...")
    
    # Initialize services
    credential_store = CredentialStore(
        sqlite_path=settings.sqlite_path,
        encryption_key=settings.encryption_key
    )
    await credential_store.initialize()
    
    token_cache = TokenCache()
    oauth_client = OAuth2Client()
    
    logger.info("Platform Auth Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    if credential_store:
        await credential_store.close()
    if token_cache:
        await token_cache.close()
    logger.info("Platform Auth Service shutdown complete")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for service monitoring."""
    return HealthResponse(
        status="healthy",
        service="platform-auth-service",
        version="1.0.0"
    )

@app.post("/credentials", response_model=CredentialResponse)
async def create_credential(
    credential: CredentialCreate,
    authorization: str = Header(...),
    _: None = Depends(verify_internal_api_key)
):
    """Create or update stored credentials for a workspace and connector."""
    try:
        # Store the encrypted credential
        await credential_store.store_credential(
            workspace_id=credential.workspace_id,
            connector_id=credential.connector_id,
            auth_type=credential.auth_type,
            credential_data=credential.credential_data
        )
        
        logger.info(
            f"Stored credential for workspace {credential.workspace_id}, "
            f"connector {credential.connector_id}"
        )
        
        return CredentialResponse(
            workspace_id=credential.workspace_id,
            connector_id=credential.connector_id,
            auth_type=credential.auth_type,
            created_at=None  # Would be populated from database
        )
    
    except Exception as e:
        logger.error(f"Failed to store credential: {e}")
        raise HTTPException(status_code=500, detail="Failed to store credential")

@app.get("/credentials/{workspace_id}")
async def get_credentials(
    workspace_id: str,
    authorization: str = Header(...),
    _: None = Depends(verify_internal_api_key)
):
    """Get all stored credentials for a workspace."""
    try:
        credentials = await credential_store.get_workspace_credentials(workspace_id)
        return {"workspace_id": workspace_id, "credentials": credentials}
    
    except Exception as e:
        logger.error(f"Failed to retrieve credentials: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve credentials")

@app.get("/token", response_model=TokenResponse)
async def get_token(
    workspace_id: str,
    connector_id: str,
    background_tasks: BackgroundTasks,
    authorization: str = Header(...),
    _: None = Depends(verify_internal_api_key)
):
    """Get a valid access token for the specified workspace and connector."""
    try:
        # Check cache first
        cached_token = await token_cache.get_token(workspace_id, connector_id)
        if cached_token and not await token_cache.is_token_expired(workspace_id, connector_id):
            logger.info(f"Returning cached token for {workspace_id}/{connector_id}")
            return TokenResponse(
                access_token=cached_token,
                token_type="Bearer",
                expires_in=3600,  # Would be calculated from actual expiry
                cached=True
            )
        
        # Get stored credentials
        credential_data = await credential_store.get_credential(workspace_id, connector_id)
        if not credential_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No credentials found for workspace {workspace_id}, connector {connector_id}"
            )
        
        # Perform OAuth2 token exchange
        token_response = await oauth_client.get_token(
            auth_type=credential_data["auth_type"],
            credential_data=credential_data["credential_data"]
        )
        
        # Cache the new token
        background_tasks.add_task(
            token_cache.store_token,
            workspace_id,
            connector_id,
            token_response["access_token"],
            token_response.get("expires_in", 3600)
        )
        
        logger.info(f"Generated new token for {workspace_id}/{connector_id}")
        
        return TokenResponse(
            access_token=token_response["access_token"],
            token_type="Bearer",
            expires_in=token_response.get("expires_in", 3600),
            cached=False
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get token: {e}")
        raise HTTPException(status_code=500, detail="Failed to get access token")

@app.delete("/credentials/{workspace_id}/{connector_id}")
async def delete_credential(
    workspace_id: str,
    connector_id: str,
    authorization: str = Header(...),
    _: None = Depends(verify_internal_api_key)
):
    """Delete stored credentials for a workspace and connector."""
    try:
        await credential_store.delete_credential(workspace_id, connector_id)
        await token_cache.invalidate_token(workspace_id, connector_id)
        
        logger.info(f"Deleted credential for {workspace_id}/{connector_id}")
        
        return {"message": "Credential deleted successfully"}
    
    except Exception as e:
        logger.error(f"Failed to delete credential: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete credential")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)