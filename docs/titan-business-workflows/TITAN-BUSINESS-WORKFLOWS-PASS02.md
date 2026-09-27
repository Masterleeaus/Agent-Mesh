# Titan Business Workflows — Pass 02

Pass 02 adds a governed runner contract over the Pass 01 ownership map. A run plan owns only workflow identity, `company_id`, actor/correlation/idempotency metadata, bounded input, and the canonical domain handoff target. It does not perform SQL or network mutation itself.

Execution requires an injected canonical-domain adapter. The adapter is called only after its authorization hook approves the exact run plan. A denied plan never invokes the domain adapter. Company-boundary aliases inside workflow input are rejected so callers cannot override the authenticated company boundary.

All eight retained workflows are supported, including the variation workflow for completeness. This remains an orchestration contract; canonical domain APIs continue to own validation, permissions, lifecycle transitions, persistence, audit, and business truth.
