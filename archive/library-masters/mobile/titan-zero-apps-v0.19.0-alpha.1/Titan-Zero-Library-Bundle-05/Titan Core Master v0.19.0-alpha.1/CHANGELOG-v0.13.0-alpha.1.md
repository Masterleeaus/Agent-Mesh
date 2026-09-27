# Titan Apps: Core v0.13.0-alpha.1 — Company Scope & Runtime Contract Upgrade

- Makes `company_id` an explicit first-class company scope contract.
- Adds compatibility normalization for legacy tenant identifiers; they resolve immediately to `company_id` and never form an independent boundary.
- Adds deterministic AppContext serialization and SHA-256 fingerprinting.
- Adds public-service diagnostics and contract-drift reporting.
- Adds suite runtime contract matrix aligned to upgraded Builder and Visual Runtime public contracts.
- Extends Core health reporting with company-boundary and public-contract diagnostics.
- Preserves canonical surfaces zero/go/hub and all legacy surface aliases.
