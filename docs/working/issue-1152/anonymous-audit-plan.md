# Anonymous public-response audit repair

Status: approved for branch implementation by the parent on 2026-10-02. PostgreSQL migration `189_audit_log_nullable_actor.sql` and MySQL migration `020_audit_log_nullable_actor.sql` are implemented and tested only on disposable databases. No live migration, deployment, or production schema change is authorized or performed. Refs #1152.

## Reproduced blocker

`apps/web/lib/db/audit.ts` permits `actor_id: null`, but `db/migrations/001_core_schema.sql` defines `audit_log.actor_id uuid NOT NULL` and `db/mysql/002_auth_clients_portable.sql` defines `actor_id CHAR(36) NOT NULL`. No later nullability change was found. A disposable PostgreSQL16 test that reads the committed audit DDL and trace migration rejects a null actor with SQLSTATE23502. The existing email response path also tries to insert NULL; that broader defect remains visible.

An unauthenticated token holder is not the company owner. Recording the owner as the public responder would fabricate provenance. Ignoring audit failures would lose required response evidence. Making the public route emit the currently typed null audit without a migration would roll back valid approvals on the committed schema.

## Implemented branch change

1. The forward-only PostgreSQL and MySQL migrations permit NULL in the existing `audit_log.actor_id` column and preserve UUID/CHAR(36), account FK, indexes, existing rows, and every other column. Prefixes 189 and 020 were checked against current main and open PR files; neither was claimed. Existing migrations were not renamed or renumbered. No new table or global store was added.
2. The portal estimate response transaction calls `appendAuditLog` with `actor_id: null`, company/estimate identifiers from the locked token-bound row, old/new status, and `via: "portal"`. The audit omits the bearer token, signature, visitor name, IP and user agent. The route does not mint a session or attribute the external response to an internal owner. This is application audit evidence, not a claim of accepted Business Evidence Ledger certification.
3. Audit insertion is mandatory before commit and before approval side effects. An audit failure rolls back the estimate response and leaves it retryable. Token replay protection, conditional company-bound writes, existing approval artifact savepoints and native FSM behavior remain.
4. The PostgreSQL16 disposable test applies committed audit DDL plus migrations 005 and 189; it covers historical actor preservation, anonymous audit insert, company FK preservation, transactional rollback, concurrent token replay and cross-company isolation. The MySQL8 disposable test applies migration 020 and covers the existing actor, nullable insertion, `CHAR(36)`, account FK and indexes. Neither test uses a live database.
5. The migration must be deployed only under the canonical storage/deployment owners' approved company-by-company migration process. This branch does not change storage placement or resolve public tokens through a global SQLite fallback.

## Compatibility and rollback

Existing non-null actors remain valid and unchanged. The current web audit readers do not select or display `actor_id`; any future reader must render NULL as an external/anonymous actor, never as an owner. Reverting application behavior is possible without deleting evidence. Reimposing NOT NULL after anonymous records exist is not a safe automatic rollback; do not delete or fabricate actors to satisfy it. Keep the additive nullable schema until a separately reviewed data/evidence strategy exists.

## Separate convergence dependency

The existing public token route still reads and locks by `share_token` before setting `app.current_account_id`. With restricted `ai_fsm_web` and current estimate RLS, that lookup returns no row. Canonical runbook TASK-146 requires bounded token-to-account resolution before protected access. The #648/#809 physical storage mapping and #302 identity/bootstrap owners have been asked to provide the canonical contract; no response/implementation is currently present on their active code. This branch does not create a competing resolver or bypass RLS, and the current disposable compatibility integration uses an owner connection. Restricted-role route certification remains blocked on that owner contract. The existing email response writer also attempts a nullable actor and logs-and-continues on audit failure; its transactional behavior is a separate coordinated change and is not certified by this portal-route patch.
