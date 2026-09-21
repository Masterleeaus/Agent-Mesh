# Roadmap

The roadmap is the planning authority for remaining Titan Zero work.

Keep goal/subgoal IDs stable where practical. Completed implementation detail should be compacted rather than duplicated. Architecture specifications belong in architecture references, not roadmap text.

The existing authoritative Titan Zero roadmap should be migrated here without recreating completed work.

## Migration integrity rule

A GitHub Issue is not by itself proof that its canonical roadmap goal JSON has been migrated. Before agents execute a goal, confirm the corresponding `roadmap/goals/<goal_id>.json` exists on `main`. Missing goal files are a migration gap and must be restored from the authoritative roadmap source before roadmap execution/compaction for that goal.
