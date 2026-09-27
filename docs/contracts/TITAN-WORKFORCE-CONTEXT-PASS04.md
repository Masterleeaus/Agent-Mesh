# Titan Workforce Context — Pass 04

Pass 04 adds task-local checkpoint state for restart and offline continuity.

## Contract

- Checkpoints are scoped to one `company_id`, task, objective and worker.
- They contain progress metadata, pending operation identifiers and canonical source IDs/versions only.
- They do not contain customer, job, workflow or other business payloads.
- Canonical CRM/business records remain the source of truth.
- Checkpoints do not grant authority and cannot change the authority captured by the governed context flow.
- Restore fails closed on company, task or worker mismatch.
- Revisions advance monotonically so device/offline persistence can reject stale writes.
- Persistence is intentionally adapter-free here: callers reuse Titan Zero's existing device/offline store rather than creating a second database.
