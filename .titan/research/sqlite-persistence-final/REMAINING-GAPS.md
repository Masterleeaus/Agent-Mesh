# Remaining Gaps

After Pass 1:

1. Trace production bootstrap and prove `SqliteRunStore` is used instead of `InMemoryRunStore`.
2. Trace production bootstrap and prove `SqliteWorkforceStore` is used.
3. Resolve company-scoped runtime recovery without breaking restart bootstrap.
4. Verify WAITING_APPROVAL / WAITING_EXTERNAL restart recovery and terminal-run exclusion.
5. Verify workforce dependencies, leases, evidence/context references and restart behaviour.
6. Locate governed memory/knowledge production store and replace any production in-memory adapter with existing durable persistence without changing the memory model.
7. Complete repository-wide tenant isolation scan.
8. Complete PostgreSQL-specific SQL portability scan across worker/business persistence paths.
9. Add meaningful restart/idempotency/company-isolation integration tests.
10. Execute relevant tests/typechecks/CI and record exact results.

## Pass 2 follow-up

- Wire and certify the existing SQLite run and workforce stores in the production composition root; coordinate with concurrent Zero/E2E agents.
- Reconcile the lockfile using repository pnpm 9 and allow the trusted `better-sqlite3` native build in CI.
- Run file backed workforce/memory recovery, full SQLite-only boot and cross-company business queries before claiming production certification.

## Pass 3 follow-up

Workforce restart has focused proof, but production wiring, memory persistence, full SQLite boot and consequential effect recovery remain unverified.

## Pass 4 follow-up

Legacy web PostgreSQL call sites, root lockfile repair with pinned pnpm 9, fresh native SQLite install, durable production bootstrap and whole-stack boot remain open. The parameter fix does not make those routes portable by itself.
