# Remaining Gaps

1. **Native business execution bindings** — map schedule/job mutation, worker assignment, customer update and invoice/payment follow-up preparation to the existing canonical domain services. Do not write directly to storage and do not create replacement domain services.
2. **Communications** — trace Titan Connect/current communications runtime for email/SMS/push, provider credentials, quiet hours, delivery receipts, retries and inbound/outbound thread correlation. Queued is not delivered.
3. **Durable idempotency bootstrap** — ExecutionGateway now accepts an async idempotency store; wire it to Agent 1's canonical SQLite persistence once its current interface is confirmed. Avoid modifying persistence ownership prematurely.
4. **Concrete Browser Node executor** — locate/converge the existing executor/runtime and bind its post-action state reads to the verifier contract. Do not create another browser architecture.
5. **MCP cancellation transport** — request signal is forwarded where client implementations support it; concrete MCP clients must be audited for actual cancellation propagation.
6. **Provider-independent verification maps** — implement canonical reread/query functions for each consequential native, connected and browser capability.
7. **Full test execution** — connector access can edit/read repository content but does not execute the repository test runner. CI/local execution evidence must be captured before declaring production verification complete.
