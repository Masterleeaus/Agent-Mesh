# Agent Mesh V3 Work Coordination

GitHub is the work and code authority.

## Builder loop
1. Read current `main`, `AGENTS.md`, the relevant roadmap goal/subgoal, and linked issue.
2. Confirm the issue describes **remaining work**. Do not repeat completed implementation.
3. Claim one subgoal only.
4. Create a dedicated branch: `agent/<goal>-<sg>-<short-name>`.
5. Implement one complete pass, including verification.
6. Push commits and open a PR linked to the issue.
7. Leave evidence in the PR: files changed, tests/checks, architecture decisions, and remaining work.
8. Do not merge your own implementation PR.

## Manager loop
1. Review PR against current `main`, roadmap intent, architecture contracts and existing evidence.
2. Reject duplicate implementation or authority drift.
3. Require CI/evidence appropriate to the change.
4. Merge accepted PR to `main`.
5. Update/close the issue and compact roadmap state so later agents see only remaining work.

## Collision rule
One claimable subgoal = one active implementation branch/PR. If another agent already owns it, select another eligible issue.

## Authority
- `main` = canonical Titan Zero code.
- Git commit SHA = exact version identity.
- GitHub Issues = claimable work.
- Pull Requests = integration boundary.
- GitHub Actions = automated verification.
- Roadmap = remaining work.
- Architecture = product/system rules.
