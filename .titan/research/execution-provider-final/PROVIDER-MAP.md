# Provider Map

| Execution class | Current canonical component | Pass-1 status | Required convergence |
|---|---|---|---|
| Native | ExecutionGateway + canonical business services | Gateway present | Map schedule/job, assignment, customer, communications and payment-follow-up preparation to existing services |
| MCP | `McpCapabilityAdapter` | Contract present | timeout, safe retry, cancellation, auth waits, structured errors, independent verification |
| Browser Node | `createBrowserNodeProvider` | Contract present | concrete executor convergence, stateful auth/MFA/approval handling, independent post-state verification |
| Evidence | gateway `evidenceSink` + provenance | Partial | mandatory correlation and lifecycle evidence without secrets |

Discovery is descriptive only. It never grants authority.
