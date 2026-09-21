# Titan Zero Canonical Rules

These are guardrails for every agent and PR.

- `company_id` is the only canonical multi-tenant boundary. Legacy tenant fields may exist only as compatibility inputs and must normalize before authorization, storage or execution.
- Canonical product surfaces are `zero`, `go`, and `hub`. Aliases are compatibility/branding only.
- Shared capability and business logic belongs in Core/shared runtimes, not duplicated in surface adapters.
- Command Bus is the mutation authority for consequential governed execution.
- Identity, capability, intelligence and authority are separate concerns.
- Device-first, privacy-first and cost-sovereignty ordering must be preserved.
- Reuse or extend canonical capabilities, workforce identities and contracts before creating new ones.
- Titan Code is private development/operations tooling and must never become a Titan Zero customer runtime dependency.
- Architecture/workforce specifications are referenced by the roadmap; large duplicate copies do not belong inside roadmap subgoals.
- Completed work is evidence, not future work. Roadmap entries and issues should describe what remains.
