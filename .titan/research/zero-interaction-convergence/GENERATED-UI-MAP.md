# Generated UI map

Schema: `titan.zero.generated-ui.v1`

Allow-listed business components:
- decision
- customer
- job
- schedule
- invoice
- comparison
- table
- timeline
- confirmation
- form
- status
- progress
- evidence
- workforce

Every component is company-scoped, `zero`-scoped, non-executable, bounded in size, strips unsafe/credential-bearing fields, and exposes only structured intents.

Authority presentation modes:
- `recommend`: review/recommendation only.
- `prepare`: prepared action, not executed.
- `approve_execute`: UI may request approval; downstream authority still decides.
- `report_executed`: renders a completed canonical outcome; it cannot cause execution.

Data/evidence are references to canonical state, not model-authored facts.
