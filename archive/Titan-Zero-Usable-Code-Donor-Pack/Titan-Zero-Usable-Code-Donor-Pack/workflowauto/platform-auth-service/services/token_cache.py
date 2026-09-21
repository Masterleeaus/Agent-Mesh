"""
Token Cache Service

Provides in-memory and Redis-based caching for OAuth2 access tokens.
Handles token expiry and automatic invalidation.
"""

import json
import redis.asyncio as redis
from typing import Optional, Dict
from datetime import datetime, timedelta
import logging

from config import get_settings

logger = logging.getLogger(__name__)


class TokenCache:
    """Token caching service with Redis backend and memory fallback."""
    
    def __init__(self):
        """Initialize token cache with Redis connection."""
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: Dict[str, Dict] = {}  # Fallback for when Redis unavailable
        self.settings = get_settings()
        
    async def _get_redis_client(self) -> Optional[redis.Redis]:
        """Get Redis client connection."""
        if self.redis_client is None and self.settings.redis_url:
            try:
                self.redis_client = redis.from_url(
                    self.settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self.redis_client.ping()
                logger.info("Connected to Redis for token caching")
            except Exception as e:
                logger.warning(f"Redis connection failed, using memory cache: {e}")
                self.redis_client = None
        
        return self.redis_client
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    def _cache_key(self, workspace_id: str, connector_id: str) -> str:
        """Generate cache key for workspace/connector pair."""
        return f"token:{workspace_id}:{connector_id}"
    
    async def store_token(
        self,
        workspace_id: str,
        connector_id: str,
        access_token: str,
        expires_in: int,
        scope: Optional[str] = None
    ) -> None:
        """
        Store access token in cache.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            access_token: OAuth2 access token
            expires_in: Token lifetime in seconds
            scope: Token scope (optional)
        """
        cache_key = self._cache_key(workspace_id, connector_id)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 30)  # 30s buffer
        
        token_data = {
            "access_token": access_token,
            "expires_at": expires_at.isoformat(),
            "scope": scope
        }
        
        # Try Redis first
        redis_client = await self._get_redis_client()
        if redis_client:
            try:
                await redis_client.setex(
                    cache_key,
                    expires_in - 30,  # Redis TTL with buffer
                    json.dumps(token_data, default=str)
                )
                logger.debug(f"Stored token in Redis for {workspace_id}/{connector_id}")
                return
            except Exception as e:
                logger.warning(f"Failed to store token in Redis: {e}")
        
        # Fallback to memory cache
        self.memory_cache[cache_key] = token_data
        logger.debug(f"Stored token in memory cache for {workspace_id}/{connector_id}")
    
    async def get_token(
        self,
        workspace_id: str,
        connector_id: str
    ) -> Optional[str]:
        """
        Retrieve access token from cache.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            
        Returns:
            Access token if found and valid, None otherwise
        """
        cache_key = self._cache_key(workspace_id, connector_id)
        
        # Try Redis first
        redis_client = await self._get_redis_client()
        if redis_client:
            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    token_data = json.loads(cached_data)
                    expires_at = datetime.fromisoformat(token_data["expires_at"])
                    
                    if datetime.utcnow() < expires_at:
                        logger.debug(f"Retrieved valid token from Redis for {workspace_id}/{connector_id}")
                        return token_data["access_token"]
                    else:
                        # Token expired, remove from cache
                        await redis_client.delete(cache_key)
                        logger.debug(f"Removed expired token from Redis for {workspace_id}/{connector_id}")
                        return None
            except Exception as e:
                logger.warning(f"Failed to retrieve token from Redis: {e}")
        
        # Fallback to memory cache
        if cache_key in self.memory_cache:
            token_data = self.memory_cache[cache_key]
            expires_at = datetime.fromisoformat(token_data["expires_at"])
            
            if datetime.utcnow() < expires_at:
                logger.debug(f"Retrieved valid token from memory cache for {workspace_id}/{connector_id}")
                return token_data["access_token"]
            else:
                # Token expired, remove from cache
                del self.memory_cache[cache_key]
                logger.debug(f"Removed expired token from memory cache for {workspace_id}/{connector_id}")
        
        return None
    
    async def is_token_expired(
        self,
        workspace_id: str,
        connector_id: str
    ) -> bool:
        """
        Check if cached token is expired.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            
        Returns:
            True if token is expired or not found
        """
        token = await self.get_token(workspace_id, connector_id)
        return token is None
    
    async def invalidate_token(
        self,
        workspace_id: str,
        connector_id: str
    ) -> None:
        """
        Invalidate cached token.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
        """
        cache_key = self._cache_key(workspace_id, connector_id)
        
        # Remove from Redis
        redis_client = await self._get_redis_client()
        if redis_client:
            try:
                await redis_client.delete(cache_key)
                logger.debug(f"Invalidated token in Redis for {workspace_id}/{connector_id}")
            except Exception as e:
                logger.warning(f"Failed to invalidate token in Redis: {e}")
        
        # Remove from memory cache
        if cache_key in self.memory_cache:
            del self.memory_cache[cache_key]
            logger.debug(f"Invalidated token in memory cache for {workspace_id}/{connector_id}")
    
    async def clear_workspace_tokens(self, workspace_id: str) -> None:
        """
        Clear all cached tokens for a workspace.
        
        Args:
            workspace_id: Workspace identifier
        """
        pattern = f"token:{workspace_id}:*"
        
        # Clear from Redis
        redis_client = await self._get_redis_client()
        if redis_client:
            try:
                keys = await redis_client.keys(pattern)
                if keys:
                    await redis_client.delete(*keys)
                    logger.debug(f"Cleared {len(keys)} tokens from Redis for workspace {workspace_id}")
            except Exception as e:
                logger.warning(f"Failed to clear workspace tokens from Redis: {e}")
        
        # Clear from memory cache
        keys_to_delete = [k for k in self.memory_cache.keys() if k.startswith(f"token:{workspace_id}:")]
        for key in keys_to_delete:
            del self.memory_cache[key]
        
        if keys_to_delete:
            logger.debug(f"Cleared {len(keys_to_delete)} tokens from memory cache for workspace {workspace_id}")