# Security Tests

Required final matrix:

- denied authority: provider execute must not be called
- expired authority: provider execute must not be called
- revoked authority: provider execute must not be called
- wrong company: provider/session/credential/capability binding rejected
- malformed provider response: fail closed
- browser prompt injection: external content cannot define authority/policy/tool instructions
- duplicate execution: same durable idempotency identity cannot repeat consequential effect
- provider failure/timeout: structured failure; retry only where declared safe
- MFA/auth waiting: WAITING_MFA / WAITING_USER_AUTH without false completion
- approval waiting: WAITING_APPROVAL without provider invocation
- verification failure: provider acknowledgement must not become verified outcome
- secret handling: evidence excludes raw token/password/secret material

Current main already has behavioural coverage for approval gating, duplicate suppression within one gateway process, raw credential rejection, browser company/domain trust boundary, and MCP discovery not granting authority. Remaining cases require implementation and final test execution.
