# Test Results

## Added
`packages/tools/execution-gateway.test.mjs`

Covers:
1. Authority-required action does not call provider.
2. Verified execution emits evidence.
3. Duplicate idempotency key suppresses second execution.
4. Raw credential material is rejected.
5. Browser Node company/domain controls.
6. Browser observations cannot define authority (prompt-injection boundary).
7. MCP discovery explicitly does not authorise tools.
8. MCP mapped invocation still requires gateway authority.

## Execution status
The GitHub connector used for this pass can write repository files/branches/PRs and inspect CI, but does not provide a repository shell for executing `node --test` directly. Tests are therefore committed but not falsely reported as locally executed.

CI/workflow status should be treated as the executable gate once the PR is opened. Agent 7 should require green repository checks before integration.
