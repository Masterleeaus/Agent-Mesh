# Workforce ownership and coverage closure

Issue #639 requires every material outcome to have deterministic Workforce ownership and a company-scoped projection without granting authority through identity.

`packages/titan-platform/src/workforce-coverage.ts` rejects duplicate agent IDs, missing parents, hierarchy cycles, cross-company requirements, and ineligible explicit owners. It selects active eligible owners deterministically by `agent_id`, represents uncovered outcomes as `MISSING`, and makes `assertWorkforceCoverageClosed` fail closed.

The closure is an authority-neutral Workforce projection. It does not execute work, authorize actions, or replace domain truth, and is reusable by Zero, Go, Hub, native mobile, and hosted Workforce consumers without creating per-surface agents.
