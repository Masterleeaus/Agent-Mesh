# Current main findings

- `/app/zero` authenticated via `getSession` and previously rendered all-zero pulse values. It now reads `attention_events` and `visits` through `queryForSession`, with explicit `account_id` scope at the legacy web DB boundary.
- `ZeroChatFirst` previously submitted `GET /app/zero?q=...`; the page ignored `q`. This was not a chat dispatch. It now exposes the missing connection without accepting a message that would be lost.
- `apps/web/app/titan/components/role-chat.tsx` is a separate demo surface: `getDemoSurfaceProjection`, hard-coded sample conversations and answers, and `TitanInteractionClient` without a transport. It cannot be substituted for the production `/app/zero` path.
- `packages/runtime/agent-runtime/index.mjs` has durable run identity and waiting/approval transitions but no observed production web binding. Its context provider is injected and must be wired to governed memory with scope checks.
- The current web DB still uses `account_id` and PostgreSQL. Agent 1 owns persistence convergence; do not infer SQLite-only startup from the new read projection.
