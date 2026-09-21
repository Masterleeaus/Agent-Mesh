# Titan Mobile Pass 59 — Native Lifecycle Contract

Push, deep links, background refresh and voice continuation are transport/resume mechanisms only. They preserve canonical `company_id`, surface, conversation, request, operation and correlation identity; they never create authority.

- Push/deep links may resume bounded presentation state but cannot directly execute a business mutation.
- Mutating continuations require online Core/Command Bus authority revalidation; offline lifecycle events never elevate authority.
- Deep-link input is allowlisted and TTL-bounded; arbitrary executable payloads are rejected.
- Background refresh is projection/sync work only and is disabled when connectivity/power policy disallows it.
- Voice continuation reuses the canonical conversation/operation context rather than creating a parallel voice authority.
- Canonical surfaces remain `zero`, `go`, `hub`; aliases normalize through the Interaction Engine bridge.
