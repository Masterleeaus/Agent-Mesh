# Agent Mesh V3 operations

## Authority
GitHub `main` is canonical development authority. Exact identity is the Git commit SHA. Roadmap planning lives in `roadmap/`; open work lives in GitHub Issues; implementation lives on branches and PRs.

## Builder lifecycle
1. Pull current `main`.
2. Read `AGENTS.md`, the issue, and its roadmap goal file.
3. Confirm the issue describes remaining work, not already-completed work.
4. Claim one issue and branch `goal<goal>/sg<subgoal>-<actor>`.
5. Deep-scan current code before implementation.
6. Deliver one complete development pass per user "next".
7. Run the strongest available targeted checks.
8. Commit and push.
9. Open/update a PR with `Closes #<issue>`.
10. Never self-merge.

## Manager lifecycle
1. Review open PRs and CI.
2. Check architecture invariants and overlap with recently merged work.
3. Request changes or merge.
4. Merged `main` becomes canonical immediately.
5. Close/compact roadmap work only when the merged implementation/evidence supports it.

## Required invariants
- `company_id` only canonical company boundary.
- Command Bus is mutation authority; accepted mutations emit Signal.
- Device-first/privacy-first/cost-sovereignty.
- Canonical surfaces: `zero`, `go`, `hub`.
- AI/provider/device identity never grants authority.
- Offline never elevates authority.
- Workforce definitions are canonical/shared, not copied into surfaces or roadmap bodies.
- Titan Code is private development tooling, never a Titan Zero production dependency.

## CI
PR CI should install the pinned pnpm version, use the frozen lockfile, then run typecheck, tests, build, architecture guardrails, and secret/merge-marker checks. If the repository does not yet contain extracted application source, CI reports that state instead of pretending application verification passed.

## Current bootstrap caveat
The repository was initialized with split Merge84 archives and an unpack workflow. Until extracted application source is present on `main`, roadmap issues can be organized but implementation branches cannot safely deep-scan/build the product source. The source import must be completed first.
