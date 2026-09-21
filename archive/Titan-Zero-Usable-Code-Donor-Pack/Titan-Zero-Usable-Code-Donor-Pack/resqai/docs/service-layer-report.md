# Service Layer Report

Audit of the shared SDK service layer (`packages/sdk/lemma-sdk.ts`):
- 11 exported functions covering CRUD, agent invocation, function execution, and audit logging
- Consistent `logOperation()` wrapper across all mutations
- No caching layer — every call hits the Lemma API directly
- `initLemmaClient()` called on every page load blocks rendering until authenticated
- Service functions in each app are thin wrappers around SDK calls — high deduplication potential

See `docs/architecture.md` for architecture overview.
