# Titan Workforce Context — Pass 1

## Canonical bounded context contract

Workforce context is a task-bounded projection of canonical Titan Zero business records. It is **not** a second database, a workflow queue, or an authority source.

Required context dimensions are `company`, `actor`, `customer`, `location`, `job`, `workflow`, and `authority`. A context envelope stores stable references plus provenance/version metadata; later passes may project least-data fields from those records for a particular task.

### Existing sources retained

- Company boundary: Titan company execution context + authenticated account/company mapping.
- Actor: authenticated web session and workforce command gateway.
- Customer: existing CRM/client records.
- Location: service-location/property records and field site context.
- Job: Job, WorkOrder and Visit records remain distinct canonical entities.
- Workflow: workflow events/cascades remain authoritative for workflow state and causality.
- Authority: existing authority runtime and governed workforce gateway remain authoritative.
- Worker memory: retained Pass 36 architecture is evidence/context only; its own manifest already states memory is neither truth nor authority.

### Invariants

1. `company_id` is the only company boundary.
2. Cross-company context use fails closed.
3. Identity and memory do not grant execution authority.
4. Canonical business records remain source of truth.
5. Context carries references/provenance first; field projection is least-data and task-bounded.
6. Ephemeral browser/session/site hints can accelerate the UX but never replace durable canonical records.
7. Context does not collapse Customer, Location, Job, WorkOrder, Visit or Workflow into one synthetic record.
