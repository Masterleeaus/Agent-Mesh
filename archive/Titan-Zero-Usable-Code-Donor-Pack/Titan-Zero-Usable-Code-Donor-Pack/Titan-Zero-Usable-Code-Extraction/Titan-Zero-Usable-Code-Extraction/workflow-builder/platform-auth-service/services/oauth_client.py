"""
OAuth2 Client Service

Handles OAuth2 client credentials flow and other authentication methods.
Provides token exchange functionality for various auth types.
"""

import httpx
from typing import Dict, Any
import logging
from models import AuthType

logger = logging.getLogger(__name__)


class OAuth2Client:
    """OAuth2 and authentication client for token exchange."""
    
    def __init__(self, timeout: int = 30):
        """
        Initialize OAuth2 client.
        
        Args:
            timeout: HTTP request timeout in seconds
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    async def close(self) -> None:
        """Close HTTP client."""
        await self.client.aclose()
    
    async def get_token(
        self,
        auth_type: str,
        credential_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get access token using the specified authentication method.
        
        Args:
            auth_type: Authentication type
            credential_data: Credential data for authentication
            
        Returns:
            Token response data
            
        Raises:
            ValueError: For unsupported auth types
            httpx.RequestError: For HTTP errors
        """
        if auth_type == AuthType.OAUTH2_CLIENT_CREDENTIALS:
            return await self._oauth2_client_credentials_flow(credential_data)
        elif auth_type == AuthType.API_KEY:
            return await self._api_key_flow(credential_data)
        elif auth_type == AuthType.BASIC_AUTH:
            return await self._basic_auth_flow(credential_data)
        else:
            raise ValueError(f"Unsupported authentication type: {auth_type}")
    
    async def _oauth2_client_credentials_flow(
        self,
        credential_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform OAuth2 client credentials flow.
        
        Args:
            credential_data: OAuth2 credentials containing client_id, client_secret, token_url
            
        Returns:
            Token response with access_token, token_type, expires_in
        """
        token_url = credential_data["token_url"]
        client_id = credential_data["client_id"]
        client_secret = credential_data["client_secret"]
        scopes = credential_data.get("scopes", [])
        
        # Prepare token request
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        if scopes:
            data["scope"] = " ".join(scopes)
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        
        try:
            logger.debug(f"Requesting OAuth2 token from {token_url}")
            response = await self.client.post(
                token_url,
                data=data,
                headers=headers
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Validate required fields
            if "access_token" not in token_data:
                raise ValueError("Invalid token response: missing access_token")
            
            logger.info(f"Successfully obtained OAuth2 token from {token_url}")
            
            return {
                "access_token": token_data["access_token"],
                "token_type": token_data.get("token_type", "Bearer"),
                "expires_in": token_data.get("expires_in", 3600),
                "scope": token_data.get("scope"),
                "refresh_token": token_data.get("refresh_token")
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"OAuth2 token request failed: {e.response.status_code} {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"OAuth2 token request error: {e}")
            raise
        except Exception as e:
            logger.error(f"OAuth2 token processing error: {e}")
            raise
    
    async def _api_key_flow(
        self,
        credential_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle API key authentication (returns the key as a long-lived token).
        
        Args:
            credential_data: API key credentials
            
        Returns:
            Token response with the API key as access_token
        """
        api_key = credential_data["api_key"]
        header_name = credential_data.get("header_name", "Authorization")
        key_prefix = credential_data.get("key_prefix", "Bearer")
        
        # For API keys, we return a long-lived token
        return {
            "access_token": api_key,
            "token_type": key_prefix,
            "expires_in": 86400,  # 24 hours (arbitrary for API keys)
            "header_name": header_name
        }
    
    async def _basic_auth_flow(
        self,
        credential_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle HTTP Basic Authentication (returns encoded credentials).
        
        Args:
            credential_data: Basic auth credentials
            
        Returns:
            Token response with encoded basic auth credentials
        """
        import base64
        
        username = credential_data["username"]
        password = credential_data["password"]
        
        # Encode credentials for Basic Auth
        credentials = f"{username}:{password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        return {
            "access_token": encoded_credentials,
            "token_type": "Basic",
            "expires_in": 86400,  # 24 hours (arbitrary for basic auth)
        }
    
    async def refresh_token(
        self,
        auth_type: str,
        credential_data: Dict[str, Any],
        refresh_token: str
    ) -> Dict[str, Any]:
        """
        Refresh an OAuth2 access token using a refresh token.
        
        Args:
            auth_type: Authentication type
            credential_data: Original credential data
            refresh_token: Refresh token
            
        Returns:
            New token response data
        """
        if auth_type != AuthType.OAUTH2_CLIENT_CREDENTIALS:
            raise ValueError("Token refresh only supported for OAuth2")
        
        token_url = credential_data["token_url"]
        client_id = credential_data["client_id"]
        client_secret = credential_data["client_secret"]
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        
        try:
            logger.debug(f"Refreshing OAuth2 token at {token_url}")
            response = await self.client.post(
                token_url,
                data=data,
                headers=headers
            )
            response.raise_for_status()
            
            token_data = response.json()
            logger.info("Successfully refreshed OAuth2 token")
            
            return {
                "access_token": token_data["access_token"],
                "token_type": token_data.get("token_type", "Bearer"),
                "expires_in": token_data.get("expires_in", 3600),
                "scope": token_data.get("scope"),
                "refresh_token": token_data.get("refresh_token", refresh_token)
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Token refresh failed: {e.response.status_code} {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise