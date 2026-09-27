# TZ-WF-HIERARCHY-001 — Pass 04

Bound standalone Workforce Agent identities into the native Manager → Supervisor → Agent hierarchy without changing agent implementations or command ownership.

- Reuses the existing standalone/starter agent descriptor semantics (`company_id`, governed handoff, identity grants no authority).
- Adds company-scoped supervisor ownership bindings with manager ancestry.
- Keeps direct invocation available, but produces an ownership-context-only invocation plan with `executionPermitted:false`.
- Requires existing authority evaluation, capability resolution and Business Ops routes before material execution.
- Rejects cross-company, disabled and domain-mismatched bindings.
- Does not touch `workforce-native/**` or replace Builder 4's native-agent lane.
