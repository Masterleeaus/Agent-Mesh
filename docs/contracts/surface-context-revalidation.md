# Surface context revalidation

Issue #542 requires Zero, Go and Hub clients to share one hosted Workforce contract while preserving company isolation during reconnect and mode changes.

The canonical TypeScript surface SDK exposes `assertSurfaceProjectionContext`. A client validates the expected `company_id`, canonical surface identity (including aliases such as `command` → `zero`), projection revision when reconnecting against a known context revision, expiry, and authority-neutral invariants.

A failed check is fail-closed: discard or quarantine the projection and refresh against the hosted runtime; never submit commands using stale, cross-company, or mis-scoped state. `company_id` is the logical tenant boundary, while the hosted Workforce remains authoritative for business truth and execution.

The same function is used by `createSurfaceClient.refreshProjection()`, giving web and native consumers identical context checks.
