# TZ-WF-HIERARCHY-001 — Pass 7

Added hierarchy-owned escalation/de-escalation and approval gates across Worker → Agent → Supervisor → Manager.

Escalations are adjacent-tier only. De-escalation is allowed only after acknowledgement or resolution and is also adjacent-tier only. Approval gates are bound to the actor identity already present in the delegation ancestry; the required Agent, Supervisor or Manager must make the decision. Workers cannot self-approve.

Hierarchy approval is coordination evidence only. Even a fully approved chain returns `READY_FOR_AUTHORITY_GATE` with `executionPermitted: false`; the existing authority evaluator, capability resolver and Business Ops route/domain services remain authoritative.
