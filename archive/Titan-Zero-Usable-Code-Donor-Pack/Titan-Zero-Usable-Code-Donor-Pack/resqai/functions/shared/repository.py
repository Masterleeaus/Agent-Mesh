from datetime import datetime, timezone
from typing import Any, Optional

from lemma_sdk import Pod

from functions.shared.cache import MemoryCache
from functions.shared.dto import FilterParam, Page, PaginationParams, SearchParams, SortDirection, SortParams, build_filter_dict, utc_now
from functions.shared.errors import AppError, NotFoundError
from functions.shared.locker import OptimisticLocker
from functions.shared.logging import LoggerContext


class BaseRepository:
    def __init__(
        self,
        pod: Pod,
        table: str,
        entity_type: str,
        logger: Optional[LoggerContext] = None,
        cache: Optional[MemoryCache] = None,
        locker: Optional[OptimisticLocker] = None,
    ) -> None:
        self._pod = pod
        self._table = table
        self._entity_type = entity_type
        self._log = logger
        self._cache = cache
        self._locker = locker

    def get(self, record_id: str, use_cache: bool = True) -> dict[str, Any]:
        cache_key = f"{self._table}:{record_id}"
        if use_cache and self._cache:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        record = self._pod.records.get(self._table, record_id)
        if not record:
            raise NotFoundError(self._entity_type, record_id)

        if self._cache and use_cache:
            self._cache.set(cache_key, record)
        return record

    def list(
        self,
        pagination: Optional[PaginationParams] = None,
        sort: Optional[SortParams] = None,
        filters: Optional[list[FilterParam]] = None,
        search: Optional[SearchParams] = None,
    ) -> Page:
        limit = pagination.page_size if pagination else 20
        offset = ((pagination.page - 1) * pagination.page_size) if pagination else 0

        filter_dict = build_filter_dict(filters or [])

        if search and search.query and search.search_fields:
            filter_dict["_search"] = search.query
            filter_dict["_search_fields"] = ",".join(search.search_fields)

        order_by = None
        if sort and sort.sort_by:
            prefix = "-" if sort.sort_dir == SortDirection.DESC else ""
            order_by = f"{prefix}{sort.sort_by}"

        records = self._pod.records.list(
            self._table,
            filters=filter_dict if filter_dict else None,
            limit=limit,
            offset=offset,
            order_by=order_by,
        )
        items = records or []
        total = len(items)

        page = pagination or PaginationParams()
        return Page(
            items=items,
            total=total,
            page=page.page,
            page_size=page.page_size,
        )

    def list_all(self, filters: Optional[dict[str, Any]] = None, limit: int = 1000) -> list[dict[str, Any]]:
        records = self._pod.records.list(self._table, filters=filters, limit=limit)
        return records or []

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        payload = {**data, "created_at": now, "updated_at": now}
        if "version" not in payload:
            payload["version"] = 1
        record = self._pod.records.create(self._table, payload)
        if self._cache:
            cache_key = f"{self._table}:{record.get('id')}"
            self._cache.set(cache_key, record)
            self._cache.invalidate_pattern(f"{self._table}:list:")
        return record

    def update(
        self,
        record_id: str,
        data: dict[str, Any],
        expected_version: Optional[int] = None,
    ) -> dict[str, Any]:
        existing = self.get(record_id, use_cache=False)

        if self._locker and expected_version is not None:
            self._locker.check_version(self._table, record_id, existing, expected_version, self._entity_type)

        now = utc_now()
        updates = {k: v for k, v in data.items() if v is not None}
        updates["updated_at"] = now

        if self._locker:
            updates = self._locker.increment_version(self._table, record_id, existing)

        self._pod.records.update(self._table, record_id, updates)
        updated = self.get(record_id, use_cache=False)

        if self._cache:
            cache_key = f"{self._table}:{record_id}"
            self._cache.set(cache_key, updated)
            self._cache.invalidate_pattern(f"{self._table}:list:")

        return updated

    def soft_delete(self, record_id: str, deleted_by: Optional[str] = None) -> dict[str, Any]:
        existing = self.get(record_id, use_cache=False)
        now = utc_now()
        updates = {
            "deleted_at": now,
            "updated_at": now,
            "status": "deleted",
        }
        if deleted_by:
            updates["updated_by"] = deleted_by

        if self._locker:
            updates = self._locker.increment_version(self._table, record_id, existing)

        self._pod.records.update(self._table, record_id, updates)
        if self._cache:
            cache_key = f"{self._table}:{record_id}"
            self._cache.delete(cache_key)
            self._cache.invalidate_pattern(f"{self._table}:list:")
        return existing

    def hard_delete(self, record_id: str) -> None:
        self._pod.records.delete(self._table, record_id)
        if self._cache:
            cache_key = f"{self._table}:{record_id}"
            self._cache.delete(cache_key)
            self._cache.invalidate_pattern(f"{self._table}:list:")

    def exists(self, record_id: str) -> bool:
        try:
            self.get(record_id)
            return True
        except NotFoundError:
            return False
