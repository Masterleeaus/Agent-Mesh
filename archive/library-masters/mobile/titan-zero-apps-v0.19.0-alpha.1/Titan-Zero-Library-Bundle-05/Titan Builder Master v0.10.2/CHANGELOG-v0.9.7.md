# Titan Builder v0.9.7 — company_id boundary correction

- Enforces `company_id` as the sole canonical company/tenant boundary for new contribution provenance.
- Keeps legacy `tenantId` only as a compatibility input that resolves immediately to `company_id`.
- Rejects conflicting canonical and legacy company identifiers.
- Does not rewrite historical donor evidence.
