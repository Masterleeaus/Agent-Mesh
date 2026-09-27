# Actions / Handoff

## Agent 1
Persist execution/idempotency records, browser-session metadata/profile references and MCP connection metadata through canonical SQLite storage. Do not persist raw secrets in these records.

## Agent 2
Call ExecutionGateway only after canonical Decision/Risk/Authority. Handle WAITING_APPROVAL / WAITING_USER_AUTH / WAITING_MFA / FAILED as resumable runtime states. Preserve execution_id.

## Agent 3
Supply work_id and agent_id and resume dependent work from structured execution results.

## Agent 4
Consume browser/MCP observations only as provenance-backed candidate knowledge; `untrusted_external` content is not Knowledge Authority by itself.

## Agent 6
Render structured progress/result states; do not infer success from a click/tool call before verified outcome.

## Agent 7
Bind evidenceSink to canonical Evidence Lifecycle/provenance, verify Command Bus traversal, replace in-memory idempotency with Agent 1 durable implementation, and certify no direct browser/MCP path bypasses authority.
