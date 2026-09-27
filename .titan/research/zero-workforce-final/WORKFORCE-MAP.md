# Workforce Map

## Integration contract
Zero should request work through Titan's existing workforce, not invent an assistant-only execution path.

Required existing concepts to preserve:
- human vs digital workers
- capability matching
- manager relationships
- decomposition
- assignment / delegation
- leases
- reassignment
- escalation
- failed-worker recovery

## Runtime handoff contract
When a digital worker owns READY work, the workforce layer should start or resume `TitanAgentRuntime` with the same canonical identity:
- company
- actor/user
- conversation
- work item
- worker/agent
- run

A reassignment must not silently create duplicate consequential execution. Existing run/work and execution idempotency/correlation must decide whether to resume, transfer or start.

## Human-worker rule
Human assignment is a workforce state, not a reason to simulate a digital run. Zero should project the assignment/wait/escalation truthfully.

## Next trace
Locate the current workforce READY/lease/assignment dispatcher and verify its exact call into persistent runtime. Changes will be limited to wiring/correlation, not a new workforce implementation.