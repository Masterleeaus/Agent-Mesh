# Zero Runtime Map

## Canonical path under audit

```text
ONE
  → ZERO
  → Interaction Engine
  → governed Context / Memory lookup
  → Workforce / WorkItem
  → TitanAgentRuntime
  → capability resolution
  → Decision / Risk / Authority
  → ExecutionGateway
  → provider execution
  → verification
  → evidence / verified outcome
  → runtime events
  → ZERO projection
```

## Runtime identity already carried
- `company_id`
- `actor_id`
- `agent_id`
- `conversation_id`
- `run_id`
- `work_id`
- `authority_context`
- `capability_context`

## Existing runtime event types observed
- `run.started`
- `agent.resumed`
- `agent.waiting`
- `reasoning.status`
- `message.delta`
- `tool.requested`
- `approval.required`
- `tool.started`
- `tool.completed`
- `run.completed`
- `run.failed`
- `run.cancelled`

## Required Zero projection vocabulary
Canonical runtime/execution events should be translated, not re-authored, into: acknowledged; analysing/preparing; progress; delegated; waiting; approval required; waiting for external system; resumed; executing; verifying; completed; failed; cancelled; escalated.

No hidden reasoning or chain-of-thought belongs in this projection.

## Correlation audit target
Every consequential operation must be traceable as:
`conversation_id → work_id → run_id → decision_id → execution_id → evidence_id → outcome`.

The next pass will identify the exact ingress/subscription/projector files and close missing correlation fields at their existing boundaries.