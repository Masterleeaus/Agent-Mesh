# Titan Apps: Core v0.14.0-alpha.1 — Runtime Envelope & Deterministic Snapshot Upgrade

- Adds canonical AppRuntimeEnvelope for carrying surface, actor, payload and `company_id` context together.
- Adds deterministic SHA-256 runtime envelope fingerprinting.
- Adds deterministic OfflineCapabilityIntent fingerprinting with explicit company boundary metadata.
- Adds SuiteContractSnapshot public contract and deterministic service snapshot implementation.
- Adds deterministic runtime dependency snapshots.
- Extends lifecycle and host diagnostics with company-boundary state and contract-drift evidence.
- Keeps `company_id` as the sole canonical tenant/company boundary with no scope inference.
