# TZ-WF-HIERARCHY-001 — Pass 09

Added a read-only hierarchy diagnostics/admin projection under the existing workforce-hierarchy library surface. It validates the persisted hierarchy before inspection, reports health/counts/issues, exposes JSON-ready hierarchy/approval/escalation/delegation/audit rows, and explicitly grants no execution authority. Existing workforce UI/routes remain unchanged; Business Ops routes and normal authority/capability resolution stay authoritative.
