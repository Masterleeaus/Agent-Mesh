from typing import Any, Optional


class AppError(Exception):
    status_code: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
            "status_code": self.status_code,
        }


class ValidationError(AppError):
    status_code = 400
    code = "VALIDATION_ERROR"

    def __init__(self, message: str, field_errors: Optional[dict[str, str]] = None) -> None:
        super().__init__(message, {"fields": field_errors or {}})


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"

    def __init__(self, entity_type: str, entity_id: str) -> None:
        super().__init__(f"{entity_type} not found: {entity_id}", {"entity_type": entity_type, "entity_id": entity_id})


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"


class VersionConflictError(AppError):
    status_code = 409
    code = "VERSION_CONFLICT"

    def __init__(self, entity_type: str, entity_id: str, current_version: int, expected_version: int) -> None:
        super().__init__(
            f"{entity_type} {entity_id} version conflict: expected {expected_version}, current {current_version}",
            {"entity_type": entity_type, "entity_id": entity_id, "current_version": current_version, "expected_version": expected_version},
        )


class UnauthorizedError(AppError):
    status_code = 403
    code = "UNAUTHORIZED"


class RateLimitError(AppError):
    status_code = 429
    code = "RATE_LIMIT_EXCEEDED"


class IdempotencyError(AppError):
    status_code = 409
    code = "IDEMPOTENCY_CONFLICT"


class DependencyError(AppError):
    status_code = 400
    code = "DEPENDENCY_ERROR"

    def __init__(self, message: str, dependency_type: str, dependency_id: str) -> None:
        super().__init__(message, {"dependency_type": dependency_type, "dependency_id": dependency_id})
