# Roadmap

The roadmap is the planning authority for remaining Titan Zero work.

Keep goal/subgoal IDs stable where practical. Completed implementation detail should be compacted rather than duplicated. Architecture specifications belong in architecture references, not roadmap text.

The existing authoritative Titan Zero roadmap should be migrated here without recreating completed work.

## Migration integrity rule

A GitHub Issue is not by itself proof that its canonical roadmap goal JSON has been migrated. Before agents execute a goal, confirm the corresponding `roadmap/goals/<goal_id>.json` exists on `main`. Missing goal files are a migration gap and must be restored from the authoritative roadmap source before roadmap execution/compaction for that goal.

## Goal-file migration status

The V3 index currently references 53 legacy goals. Goal JSON migration is incomplete and must not be inferred from Issues.

**Present on GitHub `main`:** `TZ-G00`, `TZ-ROADMAP-01` through `05`, and `TZ-ROADMAP-49` through `51`.

**Still requiring canonical goal-file migration:** `TZ-ROADMAP-06` through `48`, plus `TZ-ROADMAP-52`.

Issues for some of these goals already exist. Those issues remain useful work records, but agents must not treat a missing goal JSON as migrated roadmap authority. Restore the goal JSON from the authoritative roadmap source before executing or compacting that goal.
