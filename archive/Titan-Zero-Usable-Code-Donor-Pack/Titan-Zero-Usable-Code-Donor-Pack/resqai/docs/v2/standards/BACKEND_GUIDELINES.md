# RESQAI V2 — Backend Guidelines

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Function Structure](#1-function-structure)
2. [Validation](#2-validation)
3. [Error Responses](#3-error-responses)
4. [Transactions](#4-transactions)
5. [Retries](#5-retries)
6. [Idempotency](#6-idempotency)
7. [Performance](#7-performance)
8. [Caching](#8-caching)
9. [Security](#9-security)
10. [Connectors](#10-connectors)
11. [Events](#11-events)

---

## 1. Function Structure

### 1.1 Standard Function Template (Python)

```python
"""
v2_{domain}_{action}_{entity}

{Description of what this function does.}

Events emitted:
  - v2.{domain}.{entity}.{action}ed (WRI, ORC)
  - v2.{domain}.{entity}.{action}.failed (on error)

Dependencies:
  - v2_{domain}_det_{entity}
  - v2_{domain}_wri_{entity}
"""
import logging
from typing import Optional

from resqai_errors import NotFoundError, ValidationError
from resqai_utils.validation import validate_required, validate_uuid

logger = logging.getLogger(__name__)

INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "ticket_id": {"type": "string", "format": "uuid"},
        "org_id": {"type": "string", "format": "uuid"},
    },
    "required": ["ticket_id", "org_id"],
}


def handler(input_data: dict, context: dict) -> dict:
    """Function entry point.

    Args:
        input_data: validated input payload.
        context: execution context with keys:
            - correlation_id: str
            - org_id: str
            - user_id: str
            - role: str

    Returns:
        Standard response dict with keys:
            - success: bool
            - data: Any
            - error: Optional[dict]
    """
    correlation_id = context.get("correlation_id")
    org_id = context.get("org_id")

    logger.info("Processing request", extra={
        "correlation_id": correlation_id,
        "org_id": org_id,
    })

    try:
        # 1. Validate input
        validated = validate_input(input_data)

        # 2. Authorize
        authorize(org_id, context.get("role"))

        # 3. Execute business logic
        result = execute(validated, org_id)

        # 4. Emit event if needed
        emit_event(result, correlation_id)

        # 5. Return response
        return format_response(result)

    except NotFoundError as e:
        logger.warning("Entity not found", extra={
            "correlation_id": correlation_id,
            "error": str(e),
        })
        return error_response(e)

    except ValidationError as e:
        logger.warning("Validation failed", extra={
            "correlation_id": correlation_id,
            "error": str(e),
        })
        return error_response(e)

    except Exception as e:
        logger.error("Unexpected error", extra={
            "correlation_id": correlation_id,
            "error": str(e),
        })
        return error_response(InternalError("An unexpected error occurred"))


def validate_input(data: dict) -> dict:
    """Validate and sanitize input."""
    validate_required(data, ["ticket_id", "org_id"])
    validate_uuid(data["ticket_id"])
    return data


def authorize(org_id: str, role: str) -> None:
    """Check authorization."""
    pass


def execute(data: dict, org_id: str) -> dict:
    """Execute the business logic."""
    return {}


def emit_event(result: dict, correlation_id: str) -> None:
    """Emit domain event."""
    pass


def format_response(data: dict) -> dict:
    """Format successful response."""
    return {"success": True, "data": data}


def error_response(error: Exception) -> dict:
    """Format error response."""
    return {
        "success": False,
        "error": {
            "code": getattr(error, "code", "INTERNAL_ERROR"),
            "message": str(error),
            "details": getattr(error, "details", None),
        },
    }
```

### 1.2 Function Naming by Type

| Type | Prefix | Pattern | Example |
|------|--------|---------|---------|
| Read | `det_` | `v2_{domain}_det_{entity}` | `v2_core_det_ticket` |
| Read (list) | `det_` | `v2_{domain}_det_{entity}s` | `v2_core_det_tickets` |
| Write | `wri_` | `v2_{domain}_wri_{entity}` | `v2_core_wri_ticket` |
| Aggregate | `agg_` | `v2_{domain}_agg_{entity}_{metric}` | `v2_core_agg_ticket_metrics` |
| Orchestrate | `orc_` | `v2_{domain}_orc_{action}` | `v2_core_orc_dispatch_technician` |
| Transform | `tra_` | `v2_{domain}_tra_{action}_{target}` | `v2_notification_tra_format_sms` |

### 1.3 Return Format

```python
# Success
{
    "success": True,
    "data": { ... },         # Single entity
    "data": [ ... ],         # List of entities
    "data": { "items": [...], "total": 100, "page": 1, "page_size": 25 },  # Paginated
}

# Error
{
    "success": False,
    "error": {
        "code": "NOT_FOUND",
        "message": "Ticket not found",
        "details": { "ticket_id": "abc-123" },
        "correlation_id": "c4a8e3f2-..."
    }
}
```

---

## 2. Validation

### 2.1 Input Validation Rules
- Every function validates all inputs
- Validation happens first, before authorization
- Invalid inputs return immediately, no database writes

### 2.2 Validation Patterns

```python
from resqai_utils.validation import (
    validate_required,
    validate_uuid,
    validate_email,
    validate_phone,
    validate_enum,
    validate_range,
    validate_length,
    sanitize_string,
)


# Required fields
validate_required(data, ["ticket_id", "customer_id", "title"])

# UUID format
validate_uuid(data["ticket_id"])

# Email format
validate_email(data["email"])

# Phone format (E.164)
validate_phone(data["phone"])

# Enum values
validate_enum(data["status"], ["open", "in_progress", "resolved", "closed"])

# Numeric range
validate_range(data["priority"], 1, 5)

# String length
validate_length(data["title"], 1, 200)

# Sanitize
data["description"] = sanitize_string(data["description"], max_length=5000)
```

### 2.3 Schema Validation
```python
# JSON Schema for complex validation
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "ticket_id": {"type": "string", "format": "uuid"},
        "title": {"type": "string", "minLength": 1, "maxLength": 200},
        "priority": {"type": "integer", "minimum": 1, "maximum": 5},
        "customer_id": {"type": "string", "format": "uuid"},
        "tags": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
    },
    "required": ["ticket_id", "title", "customer_id"],
    "additionalProperties": False,
}
```

---

## 3. Error Responses

### 3.1 Standard Error Codes

| Code | HTTP Status | When |
|------|:-----------:|------|
| `NOT_FOUND` | 404 | Entity does not exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for action |
| `CONFLICT` | 409 | Resource state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `TIMEOUT` | 504 | External dependency timeout |
| `DEPENDENCY_FAILURE` | 502 | External service failure |
| `INTERNAL_ERROR` | 500 | Unexpected error |

### 3.2 Error Handling Rules
- Never expose stack traces to the caller
- Never expose database internals (table names, column names, query details)
- Log full error details internally with correlation ID
- Return user-friendly message externally
- Consistent error format across all functions

---

## 4. Transactions

### 4.1 Transaction Rules
- Single-table writes: No transaction needed (RLS handles consistency)
- Multi-table writes: Use Lemma transaction decorator
- Cross-function orchestration: Use ORC function with Saga pattern

### 4.2 Transaction Patterns

```python
# Multi-table write (within one function)
def execute(data: dict, org_id: str) -> dict:
    with transaction() as tx:
        ticket = tx.create("v2_core_tickets", data)
        log = tx.create("v2_core_audit_log", {
            "entity": "ticket",
            "entity_id": ticket["ticket_id"],
            "action": "created",
            "actor": data.get("created_by"),
        })
        return ticket


# Saga pattern (across functions, in ORC function)
def handler(input_data: dict, context: dict) -> dict:
    steps = [
        ("create_ticket", create_ticket, rollback_ticket),
        ("assign_technician", assign_technician, rollback_assignment),
        ("notify_customer", notify_customer, None),  # no rollback needed
    ]

    completed = []
    try:
        for name, action, _ in steps:
            result = action(input_data, context)
            completed.append((name, action, rollback))

        return format_response(result)

    except Exception as e:
        # Rollback in reverse order
        for name, _, rollback_fn in reversed(completed):
            if rollback_fn:
                rollback_fn(input_data, context)
        raise
```

---

## 5. Retries

### 5.1 Automatic Retry Rules

| Failure Type | Retry? | Max Retries | Backoff |
|-------------|:------:|:-----------:|---------|
| Network timeout | Yes | 3 | Exponential (1s, 2s, 4s) |
| Rate limited | Yes | 3 | Exponential + jitter |
| Internal error (500) | Yes | 2 | Exponential (1s, 2s) |
| Validation error (400) | No | 0 | — |
| Not found (404) | No | 0 | — |
| Conflict (409) | Yes | 1 | Immediate |

### 5.2 Retry Implementation

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((TimeoutError, RateLimitError)),
)
def call_external_service(payload: dict) -> dict:
    # External call with automatic retry
    pass
```

---

## 6. Idempotency

### 6.1 Idempotency Rules
- All WRI functions support idempotency via `idempotency_key`
- Idempotency key is generated by the caller (UUID v4)
- Same key within 24h returns previous result (no duplicate write)
- Store idempotency keys in `v2_settings_idempotency_keys` table

### 6.2 Idempotency Implementation

```python
def handler(input_data: dict, context: dict) -> dict:
    idempotency_key = input_data.get("idempotency_key")

    if idempotency_key:
        # Check if already processed
        existing = check_idempotency(idempotency_key)
        if existing:
            return existing["response"]

        # Store before processing (prevents duplicate if function crashes)
        lock_idempotency(idempotency_key)

    try:
        result = execute_logic(input_data)
        return format_response(result)
    except Exception:
        release_idempotency(idempotency_key)
        raise
    finally:
        if idempotency_key:
            store_result(idempotency_key, result)
```

---

## 7. Performance

### 7.1 Performance Targets
| Metric | Target | Threshold |
|--------|:------:|:---------:|
| Simple DET | < 100ms p95 | > 200ms = optimize |
| Complex DET (joins) | < 300ms p95 | > 500ms = optimize |
| WRI (single table) | < 200ms p95 | > 400ms = optimize |
| AGG (complex) | < 2s p95 | > 5s = optimize |
| ORC | < 5s p95 | > 10s = optimize |
| Connector call | < 1s p95 | > 3s = timeout |

### 7.2 Optimization Rules
- Always paginate list functions (default 25, max 100)
- Use database indexes for all query patterns
- Never N+1 query — batch load related entities
- Use projections (select only needed columns)
- Prefer database aggregations over in-code aggregations

### 7.3 Query Patterns

```python
# Bad: N+1
tickets = get_tickets(org_id)
for ticket in tickets:
    customer = get_customer(ticket["customer_id"])  # N queries

# Good: Batch load
tickets = get_tickets(org_id)
customer_ids = [t["customer_id"] for t in tickets]
customers = get_customers_batch(customer_ids)  # 1 query
```

---

## 8. Caching

### 8.1 Caching Rules
- Cache DET responses for read-heavy, slow-changing data
- Never cache WRI/ORC responses
- Cache TTL: 5 minutes default (configurable per function)
- Cache invalidation on WRI of same entity
- Use Lemma Cache service

### 8.2 Cacheable vs Non-Cacheable

| Data | Cacheable | TTL |
|------|:---------:|:---:|
| Reference data (statuses, types) | Yes | 1 hour |
| User profiles | Yes | 5 min |
| Ticket details | Conditional | 1 min |
| Aggregated metrics | Yes | 5 min |
| Active work orders | No | — |
| Real-time status | No | — |

### 8.3 Cache Implementation

```python
from resqai_cache import cache, invalidate

@cache(ttl=300)  # 5 minutes
def get_ticket(ticket_id: str, org_id: str) -> dict:
    # Expensive query
    pass

# Invalidate on write
def update_ticket(data: dict, org_id: str) -> dict:
    result = execute_update(data, org_id)
    invalidate(f"ticket:{data['ticket_id']}")
    return result
```

---

## 9. Security

### 9.1 Authentication
- All function calls require valid JWT token in authorization header
- JWT contains: `user_id`, `org_id`, `role`, `exp`
- Token validation at function entry (Lemma auth middleware)
- No public (unauthenticated) functions

### 9.2 Authorization (RLS)

```python
# Every function receives org_id from auth context
def handler(input_data: dict, context: dict) -> dict:
    org_id = context["org_id"]  # From JWT, not from input!

    # Filter all queries by org_id
    query = "SELECT * FROM v2_core_tickets WHERE org_id = :org_id AND ticket_id = :ticket_id"
    params = {"org_id": org_id, "ticket_id": input_data["ticket_id"]}
```

### 9.3 SQL Injection Prevention
- Never use string interpolation in SQL queries
- Always use parameterized queries
- Use Lemma ORM methods (`.query()`, `.create()`, `.update()`)

```python
# Never
query = f"SELECT * FROM users WHERE email = '{email}'"

# Always
query = "SELECT * FROM users WHERE email = :email"
params = {"email": email}
```

### 9.4 Input Sanitization
- Strip HTML tags from all user text input
- Enforce max length on all string fields
- Validate file uploads (type, size, content)
- Sanitize URLs before redirect

### 9.5 Rate Limiting
- Per-user rate limit: 1000 requests/minute
- Per-IP rate limit: 100 requests/minute (unauthenticated)
- Per-org rate limit: 5000 requests/minute
- Burst limit: 2× steady rate for 5 seconds
- Rate limit headers in response: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 10. Connectors

### 10.1 Connector Structure

```python
"""
v2_{provider}_connector

{Provider} integration with circuit breaker and rate limiting.

Rate limits:
  - {provider}: {limit} requests per {period}

Dependencies:
  - RESQAI_{PROVIDER}_API_KEY
"""
import logging
from typing import Optional

from resqai_connectors.base import BaseConnector
from resqai_connectors.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)


class TwilioConnector(BaseConnector):
    """Twilio SMS integration."""

    PROVIDER = "twilio"
    BASE_URL = "https://api.twilio.com/2010-04-01"
    RATE_LIMIT = 100  # requests per second
    TIMEOUT = 10  # seconds

    def __init__(self):
        super().__init__()
        self.api_key = get_env_or_throw("RESQAI_TWILIO_ACCOUNT_SID")
        self.api_secret = get_env_or_throw("RESQAI_TWILIO_AUTH_TOKEN")
        self.circuit_breaker = CircuitBreaker(
            name="twilio",
            failure_threshold=5,
            recovery_timeout=30,
        )

    def send_sms(self, to: str, message: str) -> dict:
        """Send an SMS message."""
        if self.circuit_breaker.is_open():
            raise CircuitBreakerOpenError("Twilio circuit breaker is open")

        try:
            response = self._post(f"/Accounts/{self.api_key}/Messages.json", {
                "To": to,
                "Body": message,
                "From": get_env_or_throw("RESQAI_TWILIO_PHONE_NUMBER"),
            })
            self.circuit_breaker.record_success()
            return response

        except Exception as e:
            self.circuit_breaker.record_failure()
            raise
```

### 10.2 Connector Rules
- Every connector has circuit breaker (5 failures → open, 30s recovery)
- Every connector has rate limiter (token bucket algorithm)
- Every connector has timeout (configurable per call type)
- Every connector call is logged with duration, success/failure
- Connector configuration comes from environment variables, never hardcoded
- Connectors emit events on success/failure for monitoring

### 10.3 Circuit Breaker States
```
CLOSED → Normal operation
  └── 5 consecutive failures → OPEN
OPEN → Rejecting requests
  └── 30s recovery timeout → HALF_OPEN
HALF_OPEN → Testing recovery
  └── Success → CLOSED
  └── Failure → OPEN
```

---

## 11. Events

### 11.1 Event Emission Standards

```python
# In any function that changes state:
def emit_event(event_type: str, payload: dict, correlation_id: str) -> None:
    """Emit a domain event."""
    event = {
        "type": event_type,
        "source": "v2_core_wri_ticket",
        "correlation_id": correlation_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": payload,
    }
    lemma_emit(event_type, event)
```

### 11.2 Event Naming
- See NAMING_CONVENTIONS.md section 11

### 11.3 Event Payload Rules
- Include `entity_id` for the affected resource
- Include `org_id` for multi-tenant routing
- Include previous state for state transitions
- Max payload size: 64KB
- Never include sensitive data (passwords, PII)

### 11.4 Event Categories
```
Domain events  → v2.{domain}.{entity}.{action} — business state change
System events  → v2.system.{component}.{action} — infrastructure events
Audit events   → v2.audit.{entity}.{action} — compliance tracking
Error events   → v2.error.{component}.{error_type} — failure notifications
```

---

> **End of BACKEND_GUIDELINES.md**
