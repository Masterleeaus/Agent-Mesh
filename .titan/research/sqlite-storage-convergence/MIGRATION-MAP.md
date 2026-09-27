# MIGRATION MAP

| PostgreSQL / Redis semantic | Disposition | SQLite-first equivalent |
|---|---|---|
| pgcrypto / gen_random_uuid() | REPLACE | application-generated UUID/ULID text IDs |
| uuid columns | REPLACE | TEXT identifiers with FK constraints |
| jsonb | REPLACE | canonical JSON TEXT; validate in domain layer |
| timestamptz | REPLACE | UTC timestamp TEXT |
| PL/pgSQL updated_at function | REPLACE | application write semantics or SQLite trigger where justified |
| PostgreSQL RLS + set_config | REPLACE | mandatory company-scoped repository/storage contract; optional server RLS defense-in-depth |
| PostgreSQL pool | ABSTRACT | StorageClient; SQLite default adapter |
| MySQL pool | DEFER/ABSTRACT | optional server adapter, not canonical local path |
| row locks / FOR UPDATE | REPLACE | short `BEGIN IMMEDIATE` write transactions and idempotent state transitions |
| LISTEN/NOTIFY | REPLACE/DEFER | local event/queue table; distributed notification belongs to optional fabric |
| Redis cache | REMOVE where unnecessary | bounded in-process cache; durable facts stay SQLite |
| Redis queue | REPLACE | `local_queue` durable SQLite table |
| Redis distributed lock/pubsub | DEFER | optional distributed coordination contract only |
| account_id / tenant aliases | REPLACE at canonical boundary | `company_id`; legacy names normalize before storage/authority/evidence |
| PostgreSQL migrations | KEEP as historical/server compatibility evidence | new `db/sqlite` canonical migration stream |
