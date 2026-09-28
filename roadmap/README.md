# Titan Zero Roadmap — Agent Mesh V3

GitHub `main` is canonical. Per-goal files under `roadmap/goals/` are the executable roadmap records for remaining Titan Zero work; `roadmap/INDEX.json` is the navigation/prioritisation index.

Keep goal/subgoal IDs stable where practical. Completed implementation detail should be compacted rather than duplicated. Architecture and workforce specifications belong behind references/IDs, not copied into roadmap bodies.

## Canonical architecture target

The accepted architecture target is now:

- `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md` — evidence-first sovereign architecture;
- `roadmap/PHASE-MAP-V3.md` — eight-phase convergence map over the existing executable roadmap.

The existing 55-goal roadmap remains the **execution inventory**, not a competing architecture hierarchy. Future issue/goal compaction should map remaining work beneath the eight phases rather than create a second roadmap authority.

The load-bearing architectural changes are:
- Business Evidence Ledger becomes the primary factual history rather than a downstream audit artifact;
- deterministic Business Reality/state projections fold from evidence and retain provenance;
- DirectAdmin becomes the first **Titan Server Node** deployment/control-plane adapter, not a business-system authority;
- Titan Constitution becomes machine-enforced in Phase 5;
- counterfactual branches remain separate from factual history;
- Titan Capsule + Zero Recovery establish sovereign rehydration in Phase 7;
- Federation is Phase 8 and must preserve independent company truth/authority domains.
- customer-facing **Missions** are outcome scopes over canonical state: temporary workspaces, interfaces, workforce, permissions and integrations retire cleanly after evidence-backed completion;
- the governed **AI App Foundry** resolves capability gaps reuse-first, converts imported/adapted/generated software into verified Titan Packages, and deploys them through the canonical Server Node rather than a parallel app runtime.

## Current migration status

- `roadmap/INDEX.json` is the current **55-goal** navigation/prioritisation index; it does not override per-goal execution state.
- Priority shard mappings are index-only metadata; no separate P0/P1/P2/P3 roadmap authority files are required.
- Canonical goal JSON files are present on GitHub `main` for **all 55 goals**: `TZ-G00` and `TZ-ROADMAP-01` through `TZ-ROADMAP-54`.
- `roadmap/SUBGOAL-ISSUE-MANIFEST.json` drives idempotent GitHub issue synchronization.

## Migration integrity rule

A GitHub Issue is an execution record, not by itself proof that its full canonical goal definition has been migrated.

Before an agent executes or compacts a goal:

1. confirm `roadmap/goals/<goal_id>.json` exists on current `main`;
2. read the matching issue and current code/evidence;
3. read Blueprint v3 and the phase map when architecture boundaries are affected;
4. implement only remaining work;
5. never reconstruct missing authoritative goal content from memory;
6. never introduce a second evidence ledger, business core, authority engine, workforce runtime or host-private source of truth.

## Execution model

- Blueprint v3 = canonical architectural direction.
- Phase Map v3 = convergence grouping/order.
- Roadmap goal files = remaining executable work and outcome intent.
- Issues = claimable/consolidated execution records.
- Branches = isolated implementation work.
- Pull Requests = integration/evidence boundary.
- GitHub Actions = automated verification.
- `main` = canonical code.
