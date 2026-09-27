# Test Results

## Pass 1 — static/current-main verification
The existing runtime test suite was inspected on current main. It contains coverage for:

1. basic run completion + lifecycle streaming
2. multi-turn tool use crossing authority gateway
3. approval wait + same pending call resume
4. gateway MFA wait + gateway resume without replay
5. persistent external wait + recovery visibility + resume
6. cross-company resume rejection
7. provider failure
8. tool failure
9. unverified consequential outcome failing closed
10. denied authority never executing
11. terminal cancellation
12. invalid state transitions failing closed

## Runtime persistence evidence
`packages/runtime/agent-runtime/` contains `sqlite-run-store.mjs` and `sqlite-run-store.test.mjs` in addition to the in-memory test/reference store.

## Not yet certified in this pass
- Zero chat ingress to persistent runtime
- subscribe-before-dispatch event delivery
- live Zero projection from canonical company state
- workforce READY digital-worker dispatch
- restart/recovery E2E approval continuation
- complete correlation chain through execution/evidence/outcome
- cleaning-business conversational scenarios

These are the next implementation/test targets. Agent 4 retains ownership of final cross-system E2E certification.