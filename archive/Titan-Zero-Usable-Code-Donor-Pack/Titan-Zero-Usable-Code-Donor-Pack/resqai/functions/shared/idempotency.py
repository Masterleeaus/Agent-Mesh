import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Optional

from lemma_sdk import Pod

from functions.shared.errors import IdempotencyError


class IdempotencyGuard:
    def __init__(self, pod: Pod, ttl_seconds: int = 3600) -> None:
        self._pod = pod
        self._ttl = ttl_seconds

    def check(self, key: str, operation: str, params: dict[str, Any]) -> Optional[dict[str, Any]]:
        existing = self._get(key)
        if existing:
            if existing.get("operation") == operation:
                return existing.get("result")
            raise IdempotencyError(f"Idempotency key {key} already used for different operation")
        return None

    def record(self, key: str, operation: str, params: dict[str, Any], result: dict[str, Any]) -> None:
        if not self._pod:
            return
        try:
            self._pod.records.create("idempotency_keys", {
                "idempotency_key": key,
                "operation": operation,
                "params_hash": hashlib.sha256(json.dumps(params, sort_keys=True, default=str).encode()).hexdigest(),
                "result": result,
                "expires_at": datetime.now(timezone.utc).timestamp() + self._ttl,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass

    def _get(self, key: str) -> Optional[dict[str, Any]]:
        try:
            records = self._pod.records.list("idempotency_keys", {"idempotency_key": key}, limit=1)
            if records and len(records) > 0:
                return records[0]
        except Exception:
            pass
        return None
