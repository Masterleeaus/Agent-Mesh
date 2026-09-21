# Manager Health + Error-Loop Intelligence — Pass 18

**Private Titan Code development only.** This subsystem is not a Titan Zero production runtime dependency.

The Manager health loop continuously re-reads the governed Mesh snapshot and combines deterministic Manager inspection with optional AI advisory planning. It detects stale/erroring agents, repeated identical failures, no-progress signals, and repeated recovery attempts.

The AI layer may recommend actions but cannot grant authority, promote canonical state, delete queue work, or bypass Manager governance.

The loop runs at a minimum one-minute interval and supports an attention callback. State is retained locally as bounded per-agent history so repeated failures can be recognized across cycles.
