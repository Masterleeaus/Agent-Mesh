# TZ-WF-HIERARCHY-001 — Pass 8

Implemented a device-first hierarchy persistence contract with validation-first restart recovery, append-only audit events, revision-aware mutation, and safe Supervisor/Agent/Worker reparenting.

Reparenting is rejected when matching delegations are still present, so ancestry cannot change under in-flight work. Agent and Worker moves rebuild runtime state through the existing constructors, preserving company boundaries, domain compatibility, least-authority tool bindings, and the rule that hierarchy/persistence/reparenting never grants execution authority.
