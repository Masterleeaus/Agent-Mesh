# Titan Workforce Context — Pass 06

Pass 06 adds freshness and conflict checks against mutable canonical business state.

- Context source versions are compared to current canonical record versions.
- Missing or changed records require context refresh before governed writes.
- Cross-company canonical evidence fails closed.
- When both resumed context and canonical state have diverged from the checkpoint version, the result is an explicit conflict rather than automatic overwrite.
- Freshness checks are observational and do not grant authority.
- Canonical CRM/business records remain the source of truth.
