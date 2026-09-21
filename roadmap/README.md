# Titan Zero Roadmap — Agent Mesh V3

The roadmap is the planning authority for remaining Titan Zero work.

Keep goal/subgoal IDs stable where practical. Completed implementation detail should be compacted rather than duplicated. Architecture and workforce specifications belong behind references/IDs, not copied into roadmap bodies.

## Current migration status

- `roadmap/INDEX.json` is migrated to the current **55-goal** roadmap index.
- Canonical goal JSON files are present on GitHub `main` for **all 55 goals**: `TZ-G00` and `TZ-ROADMAP-01` through `TZ-ROADMAP-54`.
- `roadmap/SUBGOAL-ISSUE-MANIFEST.json` currently covers **568 subgoal IDs** and drives idempotent GitHub issue synchronization.

## Migration integrity rule

A GitHub Issue is an execution record, not by itself proof that its full canonical goal definition has been migrated.

Before an agent executes or compacts a goal:

1. confirm `roadmap/goals/<goal_id>.json` exists on current `main`;
2. read the matching issue and current code/evidence;
3. implement only remaining work;
4. never reconstruct missing authoritative goal content from memory.

## Execution model

- Roadmap = remaining work and outcome intent.
- Issues = claimable subgoals.
- Branches = isolated implementation work.
- Pull Requests = integration/evidence boundary.
- GitHub Actions = automated verification.
- `main` = canonical code.
