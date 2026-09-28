# Titan Workforce Context — Pass 05

Pass 05 adds compact cross-agent handoff summaries.

- Handoffs retain `company_id`, objective/task/correlation identity and authority provenance.
- They carry causal links, explicit decisions, unresolved items and optional checkpoint revision.
- Each decision records who decided and the authority source/revision used.
- Handoffs are summary-only and never become execution authority.
- CRM/job/workflow records are current operational projections backed by factual Business Evidence Ledger history; business payload copies in Workforce context are forbidden.
- Checkpoint attachment must match the same company, task and worker projection.
