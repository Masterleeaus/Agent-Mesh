# Titan Workforce Context — Pass 08

Pass 08 adds deterministic context compaction, expiry and reconstruction.

- Compact context contains only bounded source references/versions, field grants, authority provenance and task identity.
- No customer/job/workflow payload is persisted.
- Compact output is deterministically sorted.
- Expiry fails closed.
- Reconstruction requires matching current canonical records, company boundary and source versions.
- Missing, cross-company or changed canonical records are rejected instead of silently restoring stale state.
