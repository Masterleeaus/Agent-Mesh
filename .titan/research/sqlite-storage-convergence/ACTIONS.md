# ACTIONS

1. Replace direct web `pg` pool and worker `PgClient` construction with the storage contract; SQLite becomes default, server adapters optional.
2. Remove mandatory `DATABASE_URL` from the local profile; add `SQLITE_PATH` with `.titan/data/titan-zero.db` default.
3. Port all current domain migrations into canonical SQLite schema while preserving constraints and indexes.
4. Convert account-scoped repositories to explicit `company_id`; legacy account/tenant inputs normalize at adapters only.
5. Add repository helpers that automatically bind company_id and reject cross-company identifiers.
6. Add PostgreSQL export -> canonical SQLite import utility after schema parity is complete.
7. Audit all Redis references with repository-local grep and classify cache/queue/lock/pubsub/session/rate-limit usage.
8. Run install, migrations, unit/integration tests, typecheck and gate on the branch before merging.
