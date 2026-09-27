# SQLite Storage Convergence — FINDINGS

## Initial architecture discovery

### Existing persistence ownership

The current web runtime is PostgreSQL-first. `apps/web/lib/db.ts` owns a singleton `pg.Pool`, while `apps/web/lib/db/portable.ts` adds a later PostgreSQL/MySQL portability layer. This means the repository currently has overlapping persistence entry points rather than one canonical storage contract.

### Tenant/company boundary gap

The current portable contract uses `SessionPayload.accountId` and SQL `account_id`. Titan's current architecture requires `company_id` as canonical. The SQLite convergence must normalize compatibility identifiers before storage/authorization rather than perpetuating `account_id` as a second canonical tenant authority.

### RLS

PostgreSQL RLS is materially implemented, not merely documented: migrations include an RLS policy migration and runtime transactions set `app.current_user_id`, `app.current_account_id`, and `app.current_role`. SQLite cannot reproduce PostgreSQL RLS. Equivalent isolation therefore belongs in required company-scoped repositories/contracts plus cross-company rejection tests.

### Migration tooling

`scripts/db-migrate.sh` is PostgreSQL-specific (`psql`, `information_schema`, `TIMESTAMPTZ`, `now()`, `ON CONFLICT`). It cannot serve the target local-first developer experience unchanged.

### Existing portability work

`apps/web/lib/db/contracts.ts`, `dialect.ts`, `portable.ts`, and `mysql.ts` show prior movement toward dialect portability. These should be converged, not replaced by a parallel architecture.

### Redis

Initial indexed source search returned no Redis matches. This is not yet sufficient to declare Redis absent: package manifests, infra, archive/donor trees, worker code, and scripts still require direct inspection before closure.

## Migration principle

PostgreSQL RLS and session configuration are defense mechanisms tied to a server database. SQLite convergence must preserve the security invariant (mandatory company context and row scoping), not the PostgreSQL mechanism itself.