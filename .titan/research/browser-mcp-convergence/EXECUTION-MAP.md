# Execution Map

```text
Agent/runtime request
  -> canonical capability resolution
  -> Decision
  -> Risk
  -> Authority
  -> ExecutionGateway
       -> native provider
       -> connected provider (API/MCP/etc.)
       -> operated provider (Browser Node)
  -> provider outcome verification
  -> evidence sink / provenance
  -> structured result for runtime/work/Zero
```

ExecutionGateway never creates authority. `approval_required` becomes WAITING_APPROVAL; browser authentication requirements become WAITING_USER_AUTH or WAITING_MFA. Provider failures are structured and cannot be reported as success. Successful consequential execution requires provider verification. Idempotency is keyed by `company_id:idempotency_key` in the contract slice; durable persistence belongs behind Agent 1 canonical storage.
