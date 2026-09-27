# WorkCore PWA Pass 1 — Complete Sync Runtime

This pass extends the existing offline foundation into a complete client-side WorkCore synchronisation runtime.

## Added

- Cursor-based incremental pull synchronisation.
- Tombstone application for server-deleted records.
- Assigned job-pack download and local persistence.
- Batch operation push with automatic single-operation fallback.
- Partial batch result reconciliation by operation ID.
- Accepted, replayed, rejected, conflict and needs-review handling.
- Server record/revision/ETag reconciliation.
- Authentication refresh callback and refresh endpoint fallback.
- Device and company headers on WorkCore requests.
- OPFS/IndexedDB attachment checksum verification.
- Resumable chunk upload sessions stored in IndexedDB.
- Upload progress events and interrupted-upload recovery.
- Sync cursor, last-pull and last-sync checkpoints.
- Structured local sync logging and expanded diagnostics.

## Expected server endpoints

- `POST /api/v1/sync/operations/batch`
- `POST /api/v1/sync/operations`
- `GET /api/v1/workcore/offline/job-packs`
- `GET /api/v1/workcore/offline/changes?cursor=...`
- `POST /api/v1/workcore/offline/attachments`
- `PUT|POST /api/v1/workcore/offline/attachments/{uploadId}`

The client falls back from the batch endpoint to the existing single-operation endpoint when the batch route returns HTTP 404, 405 or 501.

## Integration example

```js
await TitanWorkCore.client.configure({
  company_id: window.currentCompanyId,
  user_id: window.currentUserId,
  csrf_token: document.querySelector('meta[name="csrf-token"]')?.content,
  refreshAuth: async () => {
    const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    return response.ok ? response.json() : null;
  }
});

await TitanWorkCore.client.pullJobPacks();
await TitanWorkCore.client.sync();
```

## Authority boundary

The PWA stores projections and queues typed commands. WorkCore Laravel remains authoritative for permissions, financial calculations, scheduling decisions, inventory balances, compliance, approvals and final conflict resolution.
