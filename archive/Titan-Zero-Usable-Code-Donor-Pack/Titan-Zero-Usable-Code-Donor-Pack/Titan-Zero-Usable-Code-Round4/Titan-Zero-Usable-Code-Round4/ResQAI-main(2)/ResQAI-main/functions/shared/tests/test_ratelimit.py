from functions.shared.ratelimit import RateLimiter, TokenBucket
from functions.shared.errors import RateLimitError
import pytest


class TestTokenBucket:
    def test_consume_allows(self):
        bucket = TokenBucket(10, 10.0)
        assert bucket.consume() is True

    def test_consume_blocks_when_empty(self):
        bucket = TokenBucket(1, 0.0)
        assert bucket.consume() is True
        assert bucket.consume() is False

    def test_refill(self):
        bucket = TokenBucket(5, 100.0)
        for _ in range(5):
            assert bucket.consume() is True
        assert bucket.consume() is False


class TestRateLimiter:
    def test_allows_within_limit(self):
        limiter = RateLimiter()
        for _ in range(5):
            assert limiter.check("test_key", capacity=10, refill_rate=10.0, raise_on_limit=False) is True

    def test_blocks_when_exceeded(self):
        limiter = RateLimiter()
        for _ in range(5):
            limiter.check("test_key", capacity=5, refill_rate=0.0, raise_on_limit=False)
        assert limiter.check("test_key", capacity=5, refill_rate=0.0, raise_on_limit=False) is False

    def test_raises_when_exceeded(self):
        limiter = RateLimiter()
        for _ in range(3):
            limiter.check("test_key_2", capacity=3, refill_rate=0.0)
        with pytest.raises(RateLimitError):
            limiter.check("test_key_2", capacity=3, refill_rate=0.0)

    def test_different_keys_independent(self):
        limiter = RateLimiter()
        for _ in range(10):
            assert limiter.check("key_a", capacity=10, refill_rate=10.0, raise_on_limit=False) is True
            assert limiter.check("key_b", capacity=5, refill_rate=10.0, raise_on_limit=False) is True
