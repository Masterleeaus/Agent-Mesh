# Test Results

## Pass 1
Static/current-main audit only.

Existing test suite inspected: `packages/tools/execution-gateway.test.mjs`.

Covered by existing tests:
- approval-required blocks provider execution
- verified execution emits evidence
- same-process duplicate suppression
- raw credential material rejection
- Browser Node company/domain boundary
- browser observations marked untrusted
- MCP discovery does not grant authority
- denied MCP invocation remains governed

Not yet claimed as executed in this pass because the GitHub connector does not provide a shell test runner. Final runtime test evidence must come from CI/workflow or an execution-capable environment after code changes.
