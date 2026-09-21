# Titan Workforce Context — Pass 2

## Bounded context assembly

Pass 2 adds a deterministic assembler over the Pass 1 reference-first contract. The assembler accepts canonical record snapshots only long enough to validate identity, company ownership, revision and observation metadata; it emits stable references plus authority provenance rather than copying business payloads into memory.

### Assembly inputs

- `company_id` — sole company boundary.
- actor — authenticated actor ID, company and role.
- authority — governed authority source and optional revision.
- customer — optional canonical CRM/customer reference.
- location — optional service-location/property reference.
- job — optional Job/WorkOrder/Visit-side reference selected by the calling workflow.
- workflow — optional workflow/correlation record reference.
- objective/task/correlation IDs — bounded execution context.

### Safety invariants

1. Every supplied actor/business record must match the requested `company_id`.
2. `tenant_id` and `tenant_company_id` are rejected as authority inputs.
3. Actor identity is provenance only; an explicit authority source remains mandatory.
4. Customer/location/job/workflow data is not copied into the context envelope.
5. Optional context records may be omitted when the task does not need them.
6. Canonical business records remain source of truth and are re-read by the owning domain when execution requires current values.
7. The assembler is side-effect free and introduces no persistence or second business database.
