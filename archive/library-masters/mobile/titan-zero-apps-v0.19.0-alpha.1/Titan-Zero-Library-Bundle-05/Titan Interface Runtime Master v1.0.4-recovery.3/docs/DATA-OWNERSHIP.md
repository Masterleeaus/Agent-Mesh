# Data Ownership

Pass 1 owns **no database tables and no authoritative business records**. The runtime may own ephemeral/in-memory contribution descriptors and presentation metadata. Future durable caches or preferences must be explicitly declared in the manifest before introduction.

## Pass 8 read data

Read payloads are transient transport values, not Interface Runtime-owned records. Request-local memoization is process/request scoped and is never a shared cross-tenant data store. Existing CRUD/table Data-mode routes remain owned by their source extensions and no source records are copied into Interface Runtime persistence.
