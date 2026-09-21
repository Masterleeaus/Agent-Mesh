from typing import Any, Optional

from lemma_sdk import Pod

from functions.shared.errors import VersionConflictError
from functions.shared.logging import LoggerContext


class OptimisticLocker:
    def __init__(self, pod: Pod, logger: Optional[LoggerContext] = None) -> None:
        self._pod = pod
        self._log = logger

    def check_version(
        self,
        table: str,
        record_id: str,
        record: dict[str, Any],
        expected_version: Optional[int] = None,
        entity_type: Optional[str] = None,
    ) -> dict[str, Any]:
        current_version = record.get("version", 1)
        if expected_version is not None and current_version != expected_version:
            raise VersionConflictError(
                entity_type or table,
                record_id,
                current_version,
                expected_version,
            )
        return record

    def increment_version(self, table: str, record_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        current_version = updates.get("version", 1)
        updates["version"] = current_version + 1
        return updates
