# Titan Apps: Core v0.14.0-alpha.1 Upgrade Report

BASELINE: v0.13.0-alpha.1
UPGRADED VERSION: v0.14.0-alpha.1

IMPLEMENTED:
- Canonical AppRuntimeEnvelope carrying AppContext, capability, payload and idempotency key.
- Deterministic AppRuntimeEnvelope SHA-256 fingerprint.
- OfflineCapabilityIntent explicit tenant_boundary=company_id plus deterministic fingerprint.
- SuiteContractSnapshot public contract and deterministic snapshot implementation.
- Deterministic runtime dependency snapshot.
- Lifecycle and host diagnostics now include explicit company boundary and drift/snapshot evidence.
- Service provider bindings for runtime envelope factory and suite contract snapshot.

TENANT BOUNDARY:
- company_id only.
- No independent tenant_id/tenantId/tenant_company_id boundary.
- No company scope inference.

TESTS:
- PHP syntax: 66/66 PASS.
- JSON parse: 12/12 PASS.
- Standalone tests: 16/16 PASS.
- Runtime envelope propagation/fingerprint: PASS.
- Offline intent company boundary/fingerprint: PASS.
- Existing Core regression suite: PASS.
- ZIP integrity: PASS.

KNOWN LIMITATIONS:
- Full host Laravel boot with all peer extensions was not executed.

READY FOR INTEGRATION: YES
