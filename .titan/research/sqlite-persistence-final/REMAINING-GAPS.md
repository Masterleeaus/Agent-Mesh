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
