# Pass 13 — Production Runtime Bootstrap RED Gate

The authenticated Zero front door is merged, but there is no production composition root that constructs `TitanAgentRuntime` with the canonical SQLite RunStore, workforce persistence, context, capability, model and authority ports and registers it behind Zero.

Critical constraints:

- Do not create another runtime, workforce or authority engine.
- Do not use an always-allow authority adapter.
- Do not use a fake/hard-coded model router in production.
- AI provider registration metadata is not an inference implementation.
- Decision Engine activation/registration never grants execution authority.

Acceptance for this pass: introduce one composition root that concretely owns SQLite RunStore + canonical workforce + `TitanAgentRuntime`, requires real injected model/capability/context/authority ports, preserves Zero actor/conversation correlation into WorkItem/run, is idempotent by interaction/work identity, and fails closed when required provider ports are absent.
