# Chatbot bidirectional sync API contract — version 2

This contract is owned by Agent 2. Local repositories, conflict policy, media transfer and the service worker remain owned by the other agents.

## Shared metadata

`local_uuid`, `server_id`, `tenant_id`, `user_id`, `device_id`, `entity_type`, `version`, `sync_sequence`, `sync_status`, `created_at`, `updated_at`, `deleted_at`, `last_synced_at`.

## Operation statuses

`local-only`, `queued`, `sending`, `synced`, `failed`, `needs-review`, `conflict`, `cancelled`, `deleted-locally`, `deleted-remotely`.

## Operation envelope

```json
{
  "operation_uuid": "uuid",
  "idempotency_key": "uuid",
  "entity_type": "conversation|message|customer",
  "local_entity_uuid": "uuid",
  "server_entity_id": 123,
  "action": "create|update|delete",
  "expected_version": 2,
  "payload": {},
  "dependencies": ["operation-uuid"],
  "created_at": "ISO-8601",
  "retry_count": 0,
  "status": "queued",
  "last_error": null
}
```

## Device registration

`POST /api/v2/chatbot/devices/register`

Registration is scoped to the authenticated tenant and user. A revoked device must register again before syncing.

## Bootstrap

`POST /api/v2/chatbot/sync/bootstrap`

Returns the initial deterministic change page, device state and contract capabilities. Bootstrap is resumable through `next_cursor`; it is not a separate full-table export.

## Push

`POST /api/v2/chatbot/sync/push`

- Maximum 100 operations.
- Operations are dependency ordered.
- Each operation is processed independently.
- The response is HTTP 200 when all operations sync and HTTP 207 when the batch contains failures, conflicts or unresolved dependencies.
- Replaying the same idempotency key on the same tenant, user and device returns the stored canonical result.
- A stale expected version returns an operation result with `status: conflict`, `http_status: 412` and `VERSION_CONFLICT`.
- Duplicate local creation returns `status: conflict`, `http_status: 409` and `DUPLICATE_LOCAL_CREATION`.
- An unresolved dependency returns `status: needs-review`, `http_status: 424`.

## Pull

`GET /api/v2/chatbot/sync/pull?device_id=...&cursor=...&entities=message&limit=100`

Changes are ordered by the global `sync_sequence`. Clients must keep a separate cursor for each filtered entity scope. The bundled engine does this automatically. Tombstones are represented as `change_type: delete` with a null record.

## Acknowledge

`POST /api/v2/chatbot/sync/acknowledge`

Acknowledgements are accepted only for changes in the authenticated tenant. Replays are idempotent.

## Security boundaries

- Device, operation, cursor, conflict and acknowledgement lookups are tenant/user scoped.
- Entity IDs supplied by clients are never queried without the extension's existing ownership chain.
- The registry allowlists mutable fields for each entity.
- Credentials, provider tokens and sensitive chatbot configuration are not synchronised by this contract.

## Client adapter contract

The existing IndexedDB layer supplies:

- `getOutbox({statuses, limit})`
- `markOperations(operationUuids, status, error?)`
- `applyPushResult(result)`
- `getCursor(scope)`
- `setCursor(scope, cursor)`
- `applyServerChanges(changes)`
- `setLastSuccessfulSync(timestamp)`

The engine does not create a competing database or outbox.

## Bootstrap pagination requirement

A bootstrap response may set `has_more` to `true`. Clients must not mark the entity scope as bootstrapped until all subsequent pull pages have been applied and acknowledged. The cursor must be persisted after every successfully applied page so an interrupted bootstrap can resume safely.
