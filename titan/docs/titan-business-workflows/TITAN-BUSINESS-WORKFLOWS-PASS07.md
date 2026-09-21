# Titan Business Workflows — Pass 07

Pass 07 integrates workforce hierarchy participants into business workflows without moving authority into workflow metadata.

## Guarantees

- Manager → Supervisor → Agent → Worker is the only accepted downstream hierarchy sequence.
- Handoffs may move one adjacent tier at a time; upward shortcuts and tier skipping fail closed.
- Identity, hierarchy position, delegation and handoff metadata do not grant execution authority.
- Delegated authority ceilings may contract but never expand across a workflow handoff.
- Execution eligibility requires both an explicit authority-decision reference and a capability-resolution reference.
- Company, correlation, workflow and manager boundaries must remain stable across a handoff.
- Canonical domain APIs remain the owners of business-state mutations.
- This pass adds no direct SQL, fetch, queue ownership, schema migration or UI mutation surface.
