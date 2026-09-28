# Packages agent boundary

Inherits the root `AGENTS.md`.

## Purpose
`packages/` contains reusable canonical capabilities and shared domain/runtime contracts.

## Rules
- Search for the existing canonical owner before creating a package, interface, registry, store, gateway, or engine.
- Keep dependency direction clean: shared packages must not depend on app-specific UI/runtime concerns.
- Business invariants belong with their canonical domain owner and must have tests.
- Contract changes require consumer impact analysis and compatibility handling.
- Persistence changes must preserve migration/recovery rules and canonical tenant scoping.
- Authority, evidence, execution, identity, storage, security, and tenancy changes are Tier 3.
- Avoid generic abstractions without a current concrete consumer; prefer the smallest stable contract that satisfies the mission.
