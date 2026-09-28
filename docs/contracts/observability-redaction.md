# Observability redaction contract

Observability is diagnostic only and must not become a secondary data or authority surface. Before an observation payload is persisted or exported, the canonical observability contract recursively replaces values under these keys with `[REDACTED]`:

- authorization, cookie, password, secret, token, API/private keys;
- prompt content;
- email, phone, mobile and address fields;
- customer and customer-data fields.

Safe diagnostic fields remain available for correlation and troubleshooting. `company_id` remains the logical diagnostic boundary, and legacy tenant boundary fields are rejected before redaction so a privacy filter cannot hide an invalid tenancy contract. Redaction does not grant authority, mutate business state or change execution decisions.
