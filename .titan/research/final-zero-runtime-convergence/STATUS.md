# Final Zero Runtime Convergence — Status

## Pass 1 — current-main archaeology

Status: IN PROGRESS

This workspace is grounded from CURRENT `main`, not prior agent reports.

### Confirmed on current main
- `packages/runtime/agent-runtime/` exists with `TitanAgentRuntime`, `RuntimeEventBus`, in-memory store, durable SQLite run store, and tests.
- Runtime canonicalizes legacy tenant ingress to `company_id` and scopes run lookup/save by `company_id`.
- Runtime has durable states including `WAITING_TOOL`, `WAITING_USER`, `WAITING_APPROVAL`, `WAITING_EXTERNAL`, `SUSPENDED`, terminal completion/failure/cancellation.
- Runtime context is loaded through an injected `contextProvider` and capability execution is mediated through an injected `authorityGateway` rather than direct tool invocation.
- Current runtime emits structured events (`run.started`, `reasoning.status`, `message.delta`, `tool.requested`, `approval.required`, `tool.started`, `tool.completed`, run/wait state events).
- `apps/web` is the active Next.js web application. The historical shorthand `/app/zero` is not a literal current-main path; current surface routing must be located under the existing web app rather than invented.
- Existing convergence workspaces are present for SQLite storage, runtime, memory/knowledge, browser/MCP, and Zero interaction. They are evidence only and will not be treated as authority over current code.

### Critical gap already visible
`TitanAgentRuntime.resume()` currently transitions a waiting run back to `RUNNING` but does not itself consume/execute the stored pending approval tool call. The approval-resume contract therefore needs to be traced through the existing authority/execution integration before changing runtime semantics.

### Next
Trace current-main Zero routes/components/API, workforce stores and WorkItem wake semantics, Decision/Risk/Authority adapters, ExecutionGateway, Browser/MCP wait/result contracts, and memory context provider. Then implement the smallest canonical adapters required for the real end-to-end path without creating parallel architecture.
