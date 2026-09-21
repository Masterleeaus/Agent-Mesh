from datetime import datetime, timezone
from typing import Any, Optional

from lemma_sdk import Pod

from functions.shared.errors import AppError
from functions.shared.logging import LoggerContext


class AuditLogger:
    def __init__(self, pod: Pod, logger: Optional[LoggerContext] = None) -> None:
        self._pod = pod
        self._log = logger

    def log(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_type: str = "system",
        actor_id: Optional[str] = None,
        previous_state: Optional[dict[str, Any]] = None,
        new_state: Optional[dict[str, Any]] = None,
        changed_fields: Optional[list[str]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> str:
        now = datetime.now(timezone.utc).isoformat()
        record = self._pod.records.create("audit_log_v2", {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "actor_type": actor_type,
            "actor_id": actor_id or "",
            "previous_state": previous_state or {},
            "new_state": new_state or {},
            "changed_fields": changed_fields or list((new_state or {}).keys()) if new_state and not changed_fields else (changed_fields or []),
            "ip_address": ip_address or "",
            "user_agent": user_agent or "",
            "correlation_id": correlation_id or "",
            "created_at": now,
        })
        audit_id = record.get("id", "")
        if self._log:
            self._log.info(
                f"Audit: {action} on {entity_type}:{entity_id}",
                extra={
                    "audit_id": audit_id,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "action": action,
                    "actor_type": actor_type,
                    "actor_id": actor_id,
                    "correlation_id": correlation_id,
                },
            )
        return audit_id

    def log_create(
        self,
        entity_type: str,
        entity_id: str,
        state: dict[str, Any],
        actor_type: str = "system",
        actor_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> str:
        return self.log(
            entity_type=entity_type,
            entity_id=entity_id,
            action=f"{entity_type}.created",
            actor_type=actor_type,
            actor_id=actor_id,
            previous_state=None,
            new_state=state,
            changed_fields=list(state.keys()),
            correlation_id=correlation_id,
        )

    def log_update(
        self,
        entity_type: str,
        entity_id: str,
        previous_state: dict[str, Any],
        new_state: dict[str, Any],
        actor_type: str = "system",
        actor_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> str:
        changed = [k for k in new_state if previous_state.get(k) != new_state[k]]
        return self.log(
            entity_type=entity_type,
            entity_id=entity_id,
            action=f"{entity_type}.updated",
            actor_type=actor_type,
            actor_id=actor_id,
            previous_state=previous_state,
            new_state=new_state,
            changed_fields=changed,
            correlation_id=correlation_id,
        )

    def log_delete(
        self,
        entity_type: str,
        entity_id: str,
        state: dict[str, Any],
        actor_type: str = "system",
        actor_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> str:
        return self.log(
            entity_type=entity_type,
            entity_id=entity_id,
            action=f"{entity_type}.deleted",
            actor_type=actor_type,
            actor_id=actor_id,
            previous_state=state,
            new_state=None,
            correlation_id=correlation_id,
        )
