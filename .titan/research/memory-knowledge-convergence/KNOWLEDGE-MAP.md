# Knowledge Map

Knowledge is not memory and neither grants authority.

The Agent 4 port records provenance primitives (`source`, `sourceId`, `observedAt`, `evidenceRefs`) and source-sensitive confidence ceilings. Titan's existing provenance/evidence infrastructure remains the integration authority for auditable evidence.

Source precedence is intentionally conservative: verified evidence/business state can reach confidence 1.0; direct user statements 0.95; documents/email/tools 0.90; external APIs 0.85; agent inference 0.55; raw model output 0.40. These are ceilings, not truth scores.

Contradictions use explicit supersession/conflict references. A newer direct instruction can supersede an old preference without deleting its historical provenance. Where no authoritative precedence exists, retain uncertainty/conflict rather than manufacture a winner.

Agent 5 should ingest browser/MCP/tool observations as candidate knowledge with source IDs/evidence refs. Agent 7 should verify that no knowledge path establishes execution authority.
