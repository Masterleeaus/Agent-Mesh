# Titan Go v1.9.0 — Offline Scope & Runtime Resolution Hardening

- Offline replay batches are now explicitly single-company, single-actor and single-device.
- `company_id` remains the sole tenant/company boundary; batch envelopes never emit a second tenant identifier.
- Added a governed batch envelope with operation-id idempotency declaration and provider-authoritative conflict semantics.
- Runtime readiness now resolves `GoSuiteRuntimeInterface` through the application container instead of constructing `GoSuiteRuntime` directly, preserving replacement/testing/host integration boundaries.
- Titan Field remains replay and business authority; Go validates app/device envelope integrity only.
