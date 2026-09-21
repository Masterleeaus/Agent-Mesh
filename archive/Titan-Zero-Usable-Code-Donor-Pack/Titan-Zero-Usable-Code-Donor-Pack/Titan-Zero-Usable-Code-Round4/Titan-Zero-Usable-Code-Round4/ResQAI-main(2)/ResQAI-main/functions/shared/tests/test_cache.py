import time
from functions.shared.cache import MemoryCache, get_cache


class TestMemoryCache:
    def test_set_and_get(self):
        cache = MemoryCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_missing_key(self):
        cache = MemoryCache()
        assert cache.get("nonexistent") is None

    def test_delete(self):
        cache = MemoryCache()
        cache.set("key1", "value1")
        cache.delete("key1")
        assert cache.get("key1") is None

    def test_clear(self):
        cache = MemoryCache()
        cache.set("a", 1)
        cache.set("b", 2)
        cache.clear()
        assert cache.get("a") is None
        assert cache.get("b") is None

    def test_expiry(self):
        cache = MemoryCache(default_ttl=0.1)
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        time.sleep(0.15)
        assert cache.get("key1") is None

    def test_get_or_set(self):
        cache = MemoryCache()
        called = 0

        def factory():
            nonlocal called
            called += 1
            return "computed"

        result1 = cache.get_or_set("key", factory)
        assert result1 == "computed"
        assert called == 1

        result2 = cache.get_or_set("key", factory)
        assert result2 == "computed"
        assert called == 1

    def test_invalidate_pattern(self):
        cache = MemoryCache()
        cache.set("user:1", "a")
        cache.set("user:2", "b")
        cache.set("other:1", "c")
        cache.invalidate_pattern("user:")
        assert cache.get("user:1") is None
        assert cache.get("user:2") is None
        assert cache.get("other:1") == "c"

    def test_singleton(self):
        c1 = get_cache()
        c2 = get_cache()
        assert c1 is c2
