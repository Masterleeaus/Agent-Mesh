# Runtime Adapter End-to-End Verification

Pass 8 adds an end-to-end integration test across the typed adapter path, the explicitly gated legacy DOM fallback, typed failures/timeouts, company isolation, Retriever compatibility transport, navigation recovery, cancellation capability checks, and authority neutrality.

The test deliberately composes the modules introduced in Passes 2–7 rather than testing them only in isolation. It also performs a serialized-output audit to ensure no path introduces `tenant_id`, `tenant_company_id`, a true authority grant, or automatic execution after reconnect.
