# Remaining gaps

1. Bind canonical Command Bus and authority/risk decisions to the gateway. Its current `approved` shape is an input contract, not independent authorization.
2. Register concrete native business providers using existing services and independent company-scoped rereads.
3. Supply durable atomic idempotency reservation and execution journaling; current injected `get/set` store is insufficient across processes or crashes between effect and commit.
4. Implement configured MCP client discovery/invocation, cancellation, authentication waits, bounded retries and independent read verification.
5. Bind a production Browser Node executor with scoped sessions, auth/MFA/approval waits, untrusted observation handling, post-action reread and recovery.
6. Route communications through governed execution with provider delivery receipts, quiet hours and thread correlation.
7. Link request/observed result/verification evidence to decision, work, run and execution IDs without leaking secrets. Current evidence stores a request digest and metadata, not full observed state.
8. Run Agent 4 end-to-end and restart/security gates only after the above bindings exist.
