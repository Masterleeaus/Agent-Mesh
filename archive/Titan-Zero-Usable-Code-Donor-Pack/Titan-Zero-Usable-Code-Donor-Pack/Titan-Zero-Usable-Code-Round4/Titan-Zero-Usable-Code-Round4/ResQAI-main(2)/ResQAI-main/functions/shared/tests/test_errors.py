from functions.shared.errors import (
    AppError,
    ConflictError,
    DependencyError,
    IdempotencyError,
    NotFoundError,
    RateLimitError,
    UnauthorizedError,
    ValidationError,
    VersionConflictError,
)


class TestAppError:
    def test_base_error(self):
        err = AppError("something went wrong", {"detail": "test"})
        assert err.message == "something went wrong"
        assert err.details == {"detail": "test"}
        assert err.status_code == 500
        assert err.code == "INTERNAL_ERROR"
        d = err.to_dict()
        assert d["error"] == "INTERNAL_ERROR"
        assert d["message"] == "something went wrong"
        assert d["details"] == {"detail": "test"}

    def test_not_found(self):
        err = NotFoundError("Ticket", "abc-123")
        assert err.status_code == 404
        assert err.code == "NOT_FOUND"
        assert "abc-123" in err.message
        assert err.details["entity_type"] == "Ticket"
        assert err.details["entity_id"] == "abc-123"

    def test_validation_error(self):
        err = ValidationError("invalid input", {"name": "required"})
        assert err.status_code == 400
        assert err.code == "VALIDATION_ERROR"
        assert err.details["fields"] == {"name": "required"}

    def test_version_conflict(self):
        err = VersionConflictError("Ticket", "abc-123", 3, 2)
        assert err.status_code == 409
        assert err.code == "VERSION_CONFLICT"
        assert err.details["current_version"] == 3
        assert err.details["expected_version"] == 2

    def test_unauthorized(self):
        err = UnauthorizedError("not allowed")
        assert err.status_code == 403
        assert err.code == "UNAUTHORIZED"

    def test_rate_limit(self):
        err = RateLimitError("too many requests")
        assert err.status_code == 429
        assert err.code == "RATE_LIMIT_EXCEEDED"

    def test_idempotency(self):
        err = IdempotencyError("key already used")
        assert err.status_code == 409
        assert err.code == "IDEMPOTENCY_CONFLICT"

    def test_conflict(self):
        err = ConflictError("duplicate entry")
        assert err.status_code == 409
        assert err.code == "CONFLICT"

    def test_dependency(self):
        err = DependencyError("customer not found", "customer", "abc-123")
        assert err.status_code == 400
        assert err.details["dependency_type"] == "customer"
        assert err.details["dependency_id"] == "abc-123"
