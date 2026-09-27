# Pass 57 — Canonical Intelligence Router convergence

Mobile no longer treats its temporary private route policy as canonical authority. Routing policy is an injected Core-owned projection, scoped by `company_id`, versioned monotonically, and fail-closed when missing, stale, expired or cross-company.

Routing order remains: on-device → trusted Local Bridge → BYO provider → customer service → Titan entitled → Titan metered. External egress requires canonical permission. Titan-metered routing additionally requires explicit metered approval. Private data is locally constrained by default. Missing policy never enables cloud fallback.

Provider availability is capability state, not authority. Mobile cannot invent entitlement, provider credentials, metered approval or external-egress permission. Hub remains unable to use private company Local Bridge state.
