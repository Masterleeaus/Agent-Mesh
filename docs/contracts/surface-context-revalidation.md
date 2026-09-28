# Surface context revalidation

Issue #542 requires Zero, Go and Hub clients to share one hosted Workforce contract while preserving company isolation during reconnect and mode changes.

The canonical TypeScript surface SDK now exposes `assertSurfaceProjectionContext`. A client must validate:

- the expected `company_id`;
- the canonical surface identity (aliases such as `command` normalize to `zero`);
- the expected projection revision when reconnecting against a known context revision;
- the projection expiry; and
- the authority-neutral flags.

A failed check is fail-closed. The client must discard or quarantine the projection and refresh against the hosted runtime; it must not submit commands using stale, cross-company or mis-scoped state. `company_id` is the logical tenant boundary, while the hosted Workforce remains the authority for business truth and execution.

The same function is used by `createSurfaceClient.refreshProjection()`, so web and native consumers receive identical context checks when they refresh a projection.
