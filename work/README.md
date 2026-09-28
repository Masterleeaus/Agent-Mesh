# Work coordination

Titan Zero no longer maintains a repository-local Agent Mesh ledger.

For Codex and other coding agents, GitHub is the coordination system:

- Issues define durable missions and acceptance criteria.
- The exact branch `agent/<subgoal-id>` is the implementation claim/mutex.
- Commits and PRs are implementation evidence.
- GitHub Actions are verification evidence.
- Merge and issue state are completion evidence.

Do not recreate `work/claims.json`, `work/agents.json`, continuation receipts, execution-request files, or a parallel lifecycle database.

See root `AGENTS.md` and `docs/agent/MISSION_TEMPLATE.md`.
