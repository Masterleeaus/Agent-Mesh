# SQLite Storage Convergence — STATUS

Issue: #778
Branch: `agent/778`
Base main: `173a8b7f0298b61bf061f25efd8cc72652f4054e`

## State

ACTIVE — repository inspection and dependency inventory underway.

## Confirmed implementation facts

- Root `db/migrations/` is PostgreSQL-oriented and includes explicit RLS migration `003_rls_policies.sql`.
- `scripts/db-migrate.sh` is hard-wired to `psql` / `postgres:16` and requires a remote-style database URL.
- `apps/web/package.json` directly depends on `pg`, `@types/pg`, and `mysql2`.
- `apps/web/lib/db.ts` directly constructs a PostgreSQL `Pool` and sets PostgreSQL session configuration for RLS.
- `apps/web/lib/db/portable.ts` currently abstracts only PostgreSQL and MySQL; PostgreSQL remains the default branch.
- `apps/web/lib/db/contracts.ts` contains a useful executor abstraction, but tenancy is still expressed as legacy `account_id` / `accountId`, not canonical `company_id`.
- A MySQL compatibility tree also exists under `db/mysql/`; therefore this is not a simple PostgreSQL-to-SQLite search/replace.

## Immediate implementation direction

1. Inventory runtime DB call sites and PostgreSQL-only SQL semantics.
2. Reconcile canonical `company_id` with legacy account/tenant inputs at the storage boundary.
3. Establish provider-neutral storage contract and SQLite adapter.
4. Build canonical SQLite schema/migration runner rather than translating RLS literally.
5. Preserve PostgreSQL/MySQL only as optional compatibility/import adapters where justified.
6. Prove local startup/migrations do not require PostgreSQL or Redis.

No completion claim has been made; tests/gates have not yet been run.