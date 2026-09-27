"""
Authentication utilities for Platform Auth Service

Provides internal API key verification for service-to-service authentication.
"""

from fastapi import HTTPException, Header
from config import get_settings
import logging

logger = logging.getLogger(__name__)


async def verify_internal_api_key(authorization: str = Header(...)) -> None:
    """
    Verify the internal API key for service-to-service authentication.
    
    Args:
        authorization: Authorization header value
        
    Raises:
        HTTPException: If authentication fails
    """
    settings = get_settings()
    
    # Extract bearer token
    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected 'Bearer <token>'"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Verify against internal API key
    if token != settings.internal_api_key:
        logger.warning(f"Invalid internal API key provided")
        raise HTTPException(
            status_code=401,
            detail="Invalid internal API key"
        )
    
    logger.debug("Internal API key verified successfully")


def create_auth_header(api_key: str) -> str:
    """
    Create authorization header for internal service calls.
    
    Args:
        api_key: Internal API key
        
    Returns:
        Authorization header value
    """
    return f"Bearer {api_key}"