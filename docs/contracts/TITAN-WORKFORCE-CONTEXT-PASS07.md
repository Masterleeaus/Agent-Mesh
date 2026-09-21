# Titan Workforce Context — Pass 07

Pass 07 adds permission-aware field redaction and access audit evidence.

- Requested least-data fields are intersected with explicit permission grants.
- Denied fields are redacted by default; identity/role labels do not expand access.
- Sensitive fields require explicit permission just like every other field and receive distinct audit reasons.
- Access audits record field names, allow/deny outcomes and reasons only; protected business values are never copied into audit evidence.
- Company and worker mismatches fail closed.
- Access decisions are not execution authority.
