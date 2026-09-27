# Pass 06 — Inference RPC and Request Transport

## Objective

Connect Chrome extension contexts to Codee's existing shared browser-intelligence host through one governed RPC transport, with the Pass 05 offscreen runtime remaining the effect boundary.

## Reuse before rewrite

- **Existing Codee intelligence contract** remains the canonical context/authority contract.
- **Existing shared IntelligenceHost** remains the canonical runtime/session/request registry and scheduler.
- **Existing OffscreenRuntime** remains the only lifecycle wrapper for the offscreen document.
- **Auto Browser RPC transport** is used as the donor pattern for a single message funnel; Codee-specific identity and authority checks are retained instead of importing a second orchestration stack.

## Implemented

- `src/intelligence/intelligence-rpc.js` with immutable `codee.intelligence.rpc.v1` envelopes.
- Service-worker import and message routing for `INTELLIGENCE_RPC`.
- Shared runtime registration (`browser-offscreen`) rather than one runtime per tab/conversation.
- request / stream / embed / health / capabilities transport operations.
- cancellation that verifies the caller session owns the target request.
- response `requestId` verification to reject stale/misrouted responses.
- Chrome client/service adapters around `chrome.runtime.sendMessage`.

## Authority boundary

RPC is transport only. It cannot self-authorize plan advancement, canonical promotion, repository writes, shell execution, database mutation, backup approval, Supervisor verdicts, Librarian cleanup decisions, or durable memory promotion.

## Deferred

Real token streaming remains a later pass. Pass 06 transports the `stream` operation without claiming incremental token delivery. Model adapters are also deferred to their provider/runtime passes.
