# SQLite Compatibility

## Pass 1

### Certified by inspection
- Canonical storage defaults to SQLite.
- Worker dialect defaults to SQLite.
- Worker SQLite mode does not require `DATABASE_URL`.
- File-backed SQLite paths now create missing parent directories.
- WAL and foreign keys are enabled in both canonical storage and worker runtime; worker now also matches canonical busy-timeout/synchronous settings.
- `$n` placeholders are translated to SQLite positional bindings with explicit missing-binding validation.

### Still to audit
- `now()` / `current_timestamp` behaviour
- PostgreSQL casts (`::`)
- interval syntax
- `RETURNING`
- `ANY` / array semantics
- JSON/JSONB operators
- `ILIKE`
- conflict/upsert forms
- PostgreSQL-only DELETE/UPDATE forms
- whether compatibility imports impose unnecessary PostgreSQL runtime requirements on SQLite-only deployments

No claim of complete SQLite-only certification is made until integration tests execute successfully.
