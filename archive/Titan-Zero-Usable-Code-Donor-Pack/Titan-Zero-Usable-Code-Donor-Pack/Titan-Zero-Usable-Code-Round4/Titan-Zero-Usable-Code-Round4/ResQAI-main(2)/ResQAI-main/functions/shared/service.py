from typing import Any, Callable, Optional

from lemma_sdk import Pod

from functions.shared.audit import AuditLogger
from functions.shared.cache import MemoryCache
from functions.shared.dto import Page, QueryParams, ResponseWrapper
from functions.shared.errors import AppError, DependencyError
from functions.shared.idempotency import IdempotencyGuard
from functions.shared.logging import create_logger
from functions.shared.locker import OptimisticLocker
from functions.shared.ratelimit import RateLimiter
from functions.shared.repository import BaseRepository


class BaseService:
    def __init__(
        self,
        pod: Pod,
        table: str,
        entity_type: str,
        correlation_id: Optional[str] = None,
        function_name: Optional[str] = None,
    ) -> None:
        self._pod = pod
        self._entity_type = entity_type
        self._table = table
        self._correlation_id = correlation_id

        self.log = create_logger(f"service.{entity_type}", correlation_id=correlation_id, function_name=function_name)
        self.cache = MemoryCache()
        self.locker = OptimisticLocker(pod, self.log)
        self.audit = AuditLogger(pod, self.log)
        self.idempotency = IdempotencyGuard(pod)
        self.ratelimit = RateLimiter()
        self.repo = BaseRepository(pod, table, entity_type, self.log, self.cache, self.locker)

    def _ok(self, data: Any = None, pagination: Optional[Page] = None) -> ResponseWrapper:
        return ResponseWrapper(
            status="success",
            data=data,
            pagination=pagination,
            meta={"entity_type": self._entity_type, "correlation_id": self._correlation_id},
            correlation_id=self._correlation_id,
        )

    def _error(self, error: AppError) -> ResponseWrapper:
        self.log.error(str(error), extra=error.details)
        return ResponseWrapper(
            status="error",
            error=error.to_dict(),
            meta={"entity_type": self._entity_type, "correlation_id": self._correlation_id},
            correlation_id=self._correlation_id,
        )

    def get(self, record_id: str) -> ResponseWrapper:
        try:
            record = self.repo.get(record_id)
            return self._ok(record)
        except AppError as e:
            return self._error(e)

    def list(self, params: Optional[QueryParams] = None) -> ResponseWrapper:
        try:
            q = params or QueryParams()
            page = self.repo.list(
                pagination=q.pagination,
                sort=q.sort,
                filters=q.filters,
                search=q.search,
            )
            return self._ok(page.items, pagination=page)
        except AppError as e:
            return self._error(e)

    def list_all(self, filters: Optional[dict[str, Any]] = None, limit: int = 1000) -> list[dict[str, Any]]:
        return self.repo.list_all(filters, limit)

    def execute(self, fn: Callable[..., ResponseWrapper], rate_limit_key: Optional[str] = None, **kwargs: Any) -> ResponseWrapper:
        if rate_limit_key:
            self.ratelimit.check(rate_limit_key)
        try:
            return fn(**kwargs)
        except AppError as e:
            self.log.error(str(e), extra=e.details)
            return self._error(e)
        except Exception as e:
            self.log.error(f"Unexpected error: {e}")
            return self._error(AppError(str(e)))

    def check_dependency(self, table: str, dep_id: Optional[str], dep_type: str) -> None:
        if not dep_id:
            return
        try:
            repo = BaseRepository(self._pod, table, dep_type, self.log)
            repo.get(dep_id)
        except AppError:
            raise DependencyError(f"Referenced {dep_type} not found: {dep_id}", dep_type, dep_id)
