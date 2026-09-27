# Test Results

Behavioural test file added: `packages/titan-platform/test/memory-knowledge.test.ts`.

Coverage added:
- write/retrieve memory
- company isolation
- cross-company supersession denial
- contradiction supersession
- expiry
- source-sensitive confidence/provenance
- private agent scope isolation
- skill discovery
- skill-without-authority invariant

Execution status: NOT YET EXECUTED LOCALLY. This connector provides repository mutation and GitHub CI inspection but not a repository shell. A PR is opened below so repository CI can execute available gates. Do not report these tests as passing until GitHub checks provide evidence.

Known remaining test dependencies:
- SQLite restart persistence/offline operation requires Agent 1 canonical storage adapter.
- Agent 2/3 integration behavioural tests require their convergence contracts to land.
