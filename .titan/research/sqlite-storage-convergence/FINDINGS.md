# FINDINGS

- Root is a pnpm TypeScript workspace spanning apps, packages and services.
- Persistence is PostgreSQL-first in the web runtime (`apps/web/lib/db.ts`) and worker runtime; MySQL/MariaDB portability work also exists.
- Web `DATABASE_URL` is mandatory and build placeholders are PostgreSQL-oriented.
- Historical migrations are PostgreSQL SQL: pgcrypto UUIDs, JSONB, timestamptz, PL/pgSQL updated_at triggers and a dedicated RLS migration.
- Existing tenant naming is still substantially `account_id`; the convergence target requires canonical `company_id`. This is a semantic migration, not a driver swap.
- PostgreSQL session variables (`set_config`) implement RLS context. SQLite requires explicit company scoping in repositories/contracts.
- Worker package directly depends on `pg`; web package directly depends on `pg` and `mysql2`.
- Redis is configured as optional in web environment; no Redis package dependency was found in the inspected package manifests. A complete reference inventory still needs a local/CI grep because connector code search returned incomplete results.
- `packages/offline` already exists; SQLite should become its durable local substrate rather than creating a second offline architecture.
- Existing migrations preserve a useful field-service domain (users, clients, properties, jobs, visits, estimates, invoices, payments, automations, audit and later additions).
