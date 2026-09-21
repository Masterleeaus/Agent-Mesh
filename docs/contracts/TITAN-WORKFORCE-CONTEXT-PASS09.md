# Titan Workforce Context — Pass 09

Pass 09 adds safe context explainability diagnostics.

- Diagnostics explain selected/omitted sources, allowed/denied fields, freshness states and rejections.
- They use machine-safe reason codes rather than copying raw errors or business values.
- No record IDs, customer/job/location values, field values, permission source names or authority payloads are emitted.
- Diagnostics are observational only and never grant authority.
