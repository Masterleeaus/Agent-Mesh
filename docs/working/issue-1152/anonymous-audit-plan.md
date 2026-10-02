# Proposed anonymous public-response audit repair — approval required

Status: proposed, not approved or applied. Refs #1152. No production schema changes are part of the current patch.

## Reproduced blocker

`apps/web/lib/db/audit.ts` permits `actor_id: null`, but `db/migrations/001_core_schema.sql` defines `audit_log.actor_id uuid NOT NULL` and `db/mysql/002_auth_clients_portable.sql` defines `actor_id CHAR(36) NOT NULL`. No later nullability change was found. A disposable PostgreSQL16 test that reads the committed audit DDL and trace migration rejects a null actor with SQLSTATE23502. The existing email response path also tries to insert NULL; that broader defect remains visible.

An unauthenticated token holder is not the company owner. Recording the owner as the public responder would fabricate provenance. Ignoring audit failures would lose required response evidence. Making the public route emit the currently typed null audit without a migration would roll back valid approvals on the committed schema.

## Concrete proposed implementation

1. Add forward-only PostgreSQL and MySQL migrations, with fresh unused sequence numbers after checking current main/claims. Permit NULL in the existing `audit_log.actor_id` column. Keep its UUID/CHAR(36) representation, company constraint, policies, append-only permissions, existing rows and all other columns unchanged. No new tables or global store.
2. In the public estimate response transaction, call the existing `appendAuditLog` with `actor_id: null`, company/estimate identifiers derived from the locked token-bound row, old/new status and `via: "portal"`. Do not store the bearer token or raw signature in the audit metadata. Do not mint a session or attribute the external response to an internal owner. This is application audit evidence, not a claim of accepted Business Evidence Ledger certification.
3. Make audit insertion mandatory before committing the transition. An audit failure rolls back the response and leaves it retryable. Keep token replay protection, conditional company-bound writes, existing approval artifact savepoints and native FSM behavior.
4. Test migrations on disposable databases from the committed schema, preservation of existing actor rows, nullable anonymous insert, transactional rollback, concurrent token replay, cross-company denial and dialect-specific RLS SQL. Re-run full Node22/pnpm9.12 web and exact-name gate, types, lint and build.
5. Deploy only under the canonical storage/deployment owners' approved company-by-company migration process. This plan does not authorize a live migration, change storage placement or resolve public tokens through a global SQLite fallback.

## Compatibility and rollback

Existing non-null actors remain valid and unchanged. Consumers must display NULL as an external/anonymous actor, never as an owner. Inspect consumers before implementation. Reverting application behavior is possible without deleting evidence. Reimposing NOT NULL after anonymous records exist is not a safe automatic rollback; do not delete or fabricate actors to satisfy it. Keep the additive nullable schema until a separately reviewed data/evidence strategy exists.

## Separate convergence dependency

The existing public token route still uses PostgreSQL `getPool`; anonymous token-to-canonical-company-to-physical-storage placement needs coordination with #648/#809 and the identity/bootstrap owner #302. This patch neither creates a competing resolver nor claims provider parity or production readiness.
