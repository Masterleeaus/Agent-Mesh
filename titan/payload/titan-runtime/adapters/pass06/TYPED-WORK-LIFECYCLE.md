# Typed Work Lifecycle

Pass 6 wires typed work submission, acceptance, progress, completion, failure, timeout, and cancellation. It leaves the protected Retriever DOM bridge untouched.

Rules: `company_id` is immutable; progress is monotonic; terminal states reject replay; cancellation requires negotiated `cancellation`; timeout fails closed as `WORK_TIMEOUT`; and no lifecycle event grants permission or execution authority.
