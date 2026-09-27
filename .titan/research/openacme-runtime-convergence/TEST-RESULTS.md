# Test Results

## Tests added
`packages/runtime/agent-runtime/tests/agent-runtime.test.mjs`

Coverage authored for:
- basic completion + lifecycle events
- multi-turn governed tool use
- approval-required wait/resume
- external wait/recovery/resume
- company isolation
- provider failure
- tool failure
- denied authority path
- cancellation
- invalid transition rejection

## Execution status
**NOT RUN in this connector session.** The available GitHub connector can read/write repository content but does not provide a repository checkout/shell test runner. Per assignment rules, these tests are not reported as passing.

Recommended command in checkout/CI:
`node --test packages/runtime/agent-runtime/tests/agent-runtime.test.mjs`

Then run the repository's relevant quality gates from `AGENTS.md` / `ai/INVARIANTS.md` after rebasing onto current Agent 1 work.
