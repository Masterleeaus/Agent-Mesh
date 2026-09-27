# Analytics summaries + local-first snapshots — Pass 8

This pass adds deterministic daily, weekly and monthly summary contracts over already-derived KPI values.

Exports support JSON and CSV. Snapshots are keyed by company, cadence, timezone and exact window, and are designed for local-first use without becoming operational source-of-truth data.

No missing metric values are synthesized. The summary preserves each KPI status and raw value exactly as provided.
