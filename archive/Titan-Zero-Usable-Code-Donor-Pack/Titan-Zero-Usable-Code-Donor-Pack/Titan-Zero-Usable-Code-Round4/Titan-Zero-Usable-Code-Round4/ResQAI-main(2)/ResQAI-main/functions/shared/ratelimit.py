import time
from typing import Optional

from functions.shared.errors import RateLimitError


class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float) -> None:
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = time.time()

    def _refill(self) -> None:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    def consume(self, tokens: int = 1) -> bool:
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, TokenBucket] = {}

    def check(self, key: str, capacity: int = 100, refill_rate: float = 10.0, raise_on_limit: bool = True) -> bool:
        if key not in self._buckets:
            self._buckets[key] = TokenBucket(capacity, refill_rate)
        allowed = self._buckets[key].consume()
        if not allowed and raise_on_limit:
            raise RateLimitError(f"Rate limit exceeded for {key}")
        return allowed


_INSTANCE: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = RateLimiter()
    return _INSTANCE
