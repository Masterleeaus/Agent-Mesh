import time
from typing import Any, Callable, Optional


class CacheEntry:
    def __init__(self, value: Any, ttl: float) -> None:
        self.value = value
        self.expires_at = time.time() + ttl


class MemoryCache:
    def __init__(self, default_ttl: float = 60.0) -> None:
        self._store: dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.time() > entry.expires_at:
            del self._store[key]
            return None
        return entry.value

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        self._store[key] = CacheEntry(value, ttl or self._default_ttl)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()

    def get_or_set(self, key: str, factory: Callable[[], Any], ttl: Optional[float] = None) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = factory()
        self.set(key, value, ttl)
        return value

    def invalidate_pattern(self, prefix: str) -> None:
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]


_INSTANCE: Optional[MemoryCache] = None


def get_cache(default_ttl: float = 60.0) -> MemoryCache:
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = MemoryCache(default_ttl)
    return _INSTANCE
