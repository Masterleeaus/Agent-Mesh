# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 6

## Outcome

Added a read-only Workforce Hierarchy inspection tab to the existing Settings UI. It projects the canonical organisational graph as Manager → Supervisor → Agent → Worker without introducing a second execution or authority plane.

## Projection

- Managers: 4
- Supervisors: 4
- Starter agents: 10
- Verified atomic workers: 38
- Orphan parent links: 0
- Execution authority granted by rows: 0

Workers are shown only where the canonical organisational graph explicitly binds an atomic worker to the starter agent's primary role affinity. No speculative worker parentage is invented.

## Safety

The UI is inspection-only. It exposes no execute, approve, delegate, reparent, enable, disable, hire, promote or permission controls. The projection declares `readOnly: true`, `executionPermitted: false`, and `grantsAuthority: false`. Existing governed authority evaluation and capability resolution remain authoritative.

## Verification

- Changed TypeScript/TSX transpile: 4/4 PASS
- Hierarchy structure assertions: PASS
- Managers present: PASS
- Supervisors present: PASS
- 10 starter agents present: PASS
- Atomic workers present: PASS
- Parent links resolve: PASS
- Every row `executionAuthority === false`: PASS
