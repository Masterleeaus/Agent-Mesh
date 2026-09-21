# TZ-NEXT-015 Pass 5 — Workforce setup

Pass 5 wires onboarding workforce configuration to Titan Zero's existing installed client workforce catalogue and company-scoped business database.

It records desired role references, target worker counts, weekly availability planning windows and escalation defaults. It deliberately does **not** activate roles, create workers, mutate provider bindings, create schedules, create/acknowledge escalations or grant authority. Those actions remain owned by the existing governed Workforce runtime.

The onboarding record uses `company_id` as the sole company boundary and rejects legacy tenant aliases and cross-company payloads.
