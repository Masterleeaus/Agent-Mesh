# Canonical invocation, context, and handoff contract

The authority runtime owns the transport contract for agent invocation and handoff. `createInvocationEnvelope` carries company, actor, correlation/causation, context reference and revision, and an explicit authority ceiling. It is immutable and declares `authority_effect: false`.

`DurableAgentContextOwner` stores only a company-scoped context reference, revision, provenance, retention, and revocation state. Canonical business records and authority decisions remain the source of truth; context and identity never confer authority.

`createHandoffReceipt` requires same-company and same-context continuity, parent-to-child causation, a non-expanding authority ceiling, and continuity through the existing `AuthorityDelegation` contract. `HandoffReceiptInbox` makes receipt acceptance idempotent by handoff id and revalidates the current context before accepting it.

