"""Redis cache configuration and utilities."""

import json
import logging
from typing import Any, Optional, Union

import redis.asyncio as aioredis
from redis.exceptions import ConnectionError, RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis cache manager for async operations."""
    
    def __init__(self, redis_url: str = None):
        """Initialize cache manager.
        
        Args:
            redis_url: Redis connection URL
        """
        self.redis_url = redis_url or settings.REDIS_URL
        self._redis: Optional[aioredis.Redis] = None
    
    async def connect(self) -> None:
        """Connect to Redis."""
        try:
            self._redis = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Test connection
            await self._redis.ping()
            logger.info("Connected to Redis successfully")
        except ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._redis = None
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            logger.info("Disconnected from Redis")
    
    @property
    def redis(self) -> aioredis.Redis:
        """Get Redis client instance.
        
        Returns:
            Redis client
            
        Raises:
            RuntimeError: If not connected to Redis
        """
        if not self._redis:
            raise RuntimeError("Redis client not initialized. Call connect() first.")
        return self._redis
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        try:
            value = await self.redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except (RedisError, json.JSONDecodeError) as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value, default=str)
            ttl = ttl or settings.CACHE_TTL
            await self.redis.set(key, serialized, ex=ttl)
            return True
        except (RedisError, json.JSONEncodeError) as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = await self.redis.delete(key)
            return bool(result)
        except RedisError as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            result = await self.redis.exists(key)
            return bool(result)
        except RedisError as e:
            logger.error(f"Cache exists check error for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a numeric value in cache.
        
        Args:
            key: Cache key
            amount: Amount to increment by
            
        Returns:
            New value after increment, or None on error
        """
        try:
            result = await self.redis.incrby(key, amount)
            return result
        except RedisError as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return None
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration time for a key.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = await self.redis.expire(key, ttl)
            return bool(result)
        except RedisError as e:
            logger.error(f"Cache expire error for key {key}: {e}")
            return False
    
    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        """Get multiple values from cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs
        """
        try:
            values = await self.redis.mget(keys)
            result = {}
            for key, value in zip(keys, values):
                if value is not None:
                    try:
                        result[key] = json.loads(value)
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to decode cached value for key {key}")
            return result
        except RedisError as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    async def set_many(
        self, 
        data: dict[str, Any], 
        ttl: Optional[int] = None
    ) -> bool:
        """Set multiple values in cache.
        
        Args:
            data: Dictionary of key-value pairs
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            pipe = self.redis.pipeline()
            ttl = ttl or settings.CACHE_TTL
            
            for key, value in data.items():
                serialized = json.dumps(value, default=str)
                pipe.set(key, serialized, ex=ttl)
            
            await pipe.execute()
            return True
        except (RedisError, json.JSONEncodeError) as e:
            logger.error(f"Cache set_many error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern.
        
        Args:
            pattern: Redis pattern (e.g., 'user:*')
            
        Returns:
            Number of keys deleted
        """
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                deleted = await self.redis.delete(*keys)
                return deleted
            return 0
        except RedisError as e:
            logger.error(f"Cache clear_pattern error for pattern {pattern}: {e}")
            return 0
    
    async def health_check(self) -> dict:
        """Check Redis health status.
        
        Returns:
            Health status dictionary
        """
        try:
            # Test basic operations
            await self.redis.ping()
            await self.redis.set("health_check", "ok", ex=1)
            value = await self.redis.get("health_check")
            await self.redis.delete("health_check")
            
            # Get Redis info
            info = await self.redis.info()
            
            return {
                "redis": "healthy",
                "connection": "active",
                "version": info.get("redis_version"),
                "connected_clients": info.get("connected_clients"),
                "used_memory_human": info.get("used_memory_human"),
                "test_operation": "success" if value == "ok" else "failed",
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "redis": "unhealthy",
                "connection": "failed",
                "error": str(e),
            }


# Global cache manager instance
cache = CacheManager()


# Cache key generators
def make_cache_key(*parts: Union[str, int]) -> str:
    """Generate a cache key from parts.
    
    Args:
        *parts: Key parts to join
        
    Returns:
        Cache key string
    """
    return ":".join(str(part) for part in parts)


def user_cache_key(user_id: int, suffix: str = "") -> str:
    """Generate a user-specific cache key.
    
    Args:
        user_id: User ID
        suffix: Additional suffix
        
    Returns:
        User cache key
    """
    if suffix:
        return make_cache_key("user", user_id, suffix)
    return make_cache_key("user", user_id)


def idea_cache_key(idea_id: int, suffix: str = "") -> str:
    """Generate an idea-specific cache key.
    
    Args:
        idea_id: Idea ID
        suffix: Additional suffix
        
    Returns:
        Idea cache key
    """
    if suffix:
        return make_cache_key("idea", idea_id, suffix)
    return make_cache_key("idea", idea_id)


def dossier_cache_key(dossier_id: int, suffix: str = "") -> str:
    """Generate a dossier-specific cache key.
    
    Args:
        dossier_id: Dossier ID
        suffix: Additional suffix
        
    Returns:
        Dossier cache key
    """
    if suffix:
        return make_cache_key("dossier", dossier_id, suffix)
    return make_cache_key("dossier", dossier_id)