# Security Tests

Final matrix:

- denied authority: provider execute must not be called — behavioural coverage present
- expired authority: provider execute must not be called — behavioural coverage present
- revoked authority: provider execute must not be called — behavioural coverage present
- wrong company: provider/session/credential/capability binding rejected — Browser Node and MCP behavioural coverage present
- malformed/provider error response: fail closed — gateway/MCP structured failure path present; broader provider-specific fuzzing remains desirable
- browser prompt injection: external page observations are marked `untrusted_external`, `may_define_authority:false`; domain/session boundaries and dangerous evaluate restriction covered
- duplicate execution: durable idempotency store recovery path covered; production SQLite binding remains a persistence convergence dependency
- provider failure/timeout: MCP timeout now aborts its child transport signal; retry only where mapping declares `retrySafe`
- caller cancellation: MCP composes caller cancellation into the transport signal and does not retry an aborted request
- MFA/auth waiting: Browser Node and MCP WAITING_MFA / WAITING_USER_AUTH coverage present without false completion
- approval waiting: canonical authority gate prevents provider invocation; Browser Node/MCP provider-requested approval also returns WAITING_APPROVAL without false completion
- verification failure: provider acknowledgement cannot become verified outcome without independent verifier
- arbitrary browser evaluation: requires `explicit-dangerous` risk clearance
- secret handling: evidence recursively redacts secret/token/password/credential/authorization/cookie fields; raw credential material rejected

## Architectural boundary found in current main

`packages/tools/browser-node-contract.mjs` is a hardened provider contract, not a concrete browser automation runtime. It requires an injected `executor`, company-scoped session resolver and independent verifier. No second browser runtime should be created here. The remaining integration task is to bind the existing Titan Browser Node/runtime, when located/available, into this contract.

`packages/tools/mcp-provider-contract.mjs` is likewise a governed adapter contract. Discovery remains descriptive (`authorised:false`), tool mappings must resolve to stable Titan capabilities, and consequential completion requires an independent verification query.

## Verification status

Source-level behavioural tests were expanded for cross-company browser sessions, dangerous evaluation, browser auth/MFA/approval waits, MCP company scope, MCP auth/MFA/approval waits, timeout transport abort and caller-cancellation no-retry semantics. Connector access cannot execute the repository test runner, so CI/local execution evidence is still required before production certification.
