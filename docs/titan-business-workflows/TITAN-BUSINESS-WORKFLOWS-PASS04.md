# Titan Business Workflows — Pass 04

Implemented governed job-variation approval on top of the Merge67 canonical workflow lane.

- Approval state is metadata-only and does not duplicate or mutate work-order truth.
- Every request/decision carries an immutable, company-scoped authority snapshot.
- Identity explicitly never grants authority.
- Approval decisions are revision-checked, expiring, terminal, and audit-evidenced.
- Execution is separately gated and still flows through the canonical `crm.work_order.update` domain surface owned by the existing workflow runner.
- Cross-company, cross-work-order, expired-authority, stale-revision, and expired-approval attempts fail closed.
