# SQLite Persistence Final — Status

## Pass 1

Deep-scan started against current `main` on 2026-09-27.

### Confirmed
- `packages/storage` is SQLite-first and defaults to `.titan/data/titan-zero.db`.
- `services/worker` defaults to SQLite when `DATABASE_DIALECT` is unset; `DATABASE_URL` is only required for explicitly selected non-SQLite compatibility modes.
- A durable `SqliteRunStore` exists for the persistent agent runtime.
- A durable `SqliteWorkforceStore` exists and scopes work items and workers by `company_id`.
- In-memory workforce storage is explicitly documented as test/reference only.

### Fixed in this pass
- Canonical SQLite storage now creates its parent directory before opening a file database.
- Worker SQLite startup now creates its parent directory and applies WAL, foreign keys, busy timeout and synchronous pragmas.
- Positional parameter rewriting now validates bindings and correctly expands repeated/out-of-order `$n` placeholders.

### Not yet certified
Production bootstrap wiring for durable runtime/workforce/memory, restart recovery, full tenant isolation, and the complete PostgreSQL-specific SQL audit still require further passes and executed CI/tests.

## Pass 2 (agent/796)

Runtime restart and failure paths tested and fixed. Full production certification remains pending because no non-test bootstrap caller of the durable runtime/workforce stores was found.

## Pass 3

File backed workforce restart, worker registry, dependencies, references, expired lease recovery and company isolation pass. The existing approval wait transition was repaired. Production bootstrap and memory recovery remain open.

## Pass 4

The web SQLite client now binds numbered placeholders in occurrence order, including repeats, with an unbound-parameter failure. Full web typecheck and whole-stack SQLite boot are still not certified.
