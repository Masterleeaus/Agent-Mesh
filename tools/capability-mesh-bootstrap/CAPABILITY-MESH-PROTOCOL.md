# Capability Mesh Protocol v1

The persistent project objects are GOAL -> CAPABILITY -> CONTRACT -> IMPLEMENTATION -> TEST -> EVIDENCE -> DEPENDENCY -> PROVENANCE. Agents are temporary workers over this graph.

## Completion states
- PROPOSED: design/intent only.
- PARTIAL: implementation or acceptance gates remain incomplete.
- IMPLEMENTED: code/artifact exists, but independent verification is incomplete.
- VERIFIED: acceptance gates have evidence and verifier is distinct from the builder unless Manager explicitly records an exception.
- BLOCKED: external dependency or verified collision prevents progress.
- SUPERSEDED: a newer verified capability record replaces this one.

## `next` invariant
Every `next`, `continue`, `proceed`, or new pass means:
1. Re-read Manager baseline and live coordination state.
2. Discover intervening deltas/handoffs and active claims.
3. Reconcile dependencies and collisions against the frozen task base.
4. Select the highest-priority eligible objective, never merely the next numbered pass.
5. Require/emit a narrow ACTIVE claim before editing.
6. Implement without removing retained behavior by default.
7. Run acceptance + regression + impact-targeted verification.
8. Publish cumulative/delta/evidence/handoff when source implementation changed.
9. Mark IMPLEMENTED until independent verification evidence satisfies VERIFIED rules.
10. Manager alone promotes canonical state.

## Role separation
Builder produces implementation. Auditor searches for defects and missing gates. Verifier certifies evidence. Integrator resolves semantic overlap. Manager owns canonical promotion and conflict decisions.
