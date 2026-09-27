# Interaction map

```text
ONE input (text / voice / image / camera / generated action)
  -> createZeroInteraction
  -> canonical Interaction Engine / context + referents
  -> Agent 2 runtime / Agent 3 workforce
  -> Decision Engine
  -> Authority boundary
  -> Agent 5 execution path
  -> evidence/outcome
  -> chat protocol event / stream delta
  -> Interface Runtime
  -> bounded Zero generated UI
```

Rules:
- Conversation/context persistence is company-scoped and authority-neutral.
- Generated action clicks emit intents; they never execute directly.
- `recommend` and `prepare` do not imply execution.
- `approve_execute` still requires downstream authorization.
- `report_executed` is presentation of a canonical completed outcome, never a UI grant.
- Cancellation/redirect/wait/resume should be runtime/workforce commands once Agents 2/3 contracts land.
- No chain-of-thought is surfaced; progress is operational event state only.
