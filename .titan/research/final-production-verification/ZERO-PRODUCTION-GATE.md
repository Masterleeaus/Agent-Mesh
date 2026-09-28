# Zero Production Transport Release Gate

Status: BLOCKING until executable production wiring exists.

## Required canonical path

`Zero submit -> authenticated company/actor conversation -> WorkItem -> persistent TitanAgentRuntime -> Decision/Risk/Authority -> ExecutionGateway -> independent verification -> Evidence -> verified outcome projection -> Zero`

## Required correlations

Every consequential command must preserve or derive authoritative references for:

- `company_id`
- `actor_id`
- `conversation_id`
- `work_id`
- `run_id`
- `agent_id`
- `decision_id`
- `execution_id`
- `evidence_id`

The web layer must not manufacture missing downstream IDs.

## Transport acceptance criteria

1. Zero command submission uses an authenticated server-side production transport, not a GET form or a client-only synthetic state transition.
2. Tenant scope comes from authenticated server context. User-supplied `company_id` cannot select another company.
3. Event listeners/subscriptions are established before dispatch so early runtime events cannot be lost.
4. A new business objective creates or correlates a canonical WorkItem and persistent run.
5. Follow-up user input resumes the same conversation/run where appropriate instead of creating duplicate consequential work.
6. Approval and rejection resume the same waiting `work_id` / `run_id`; approval does not cause the model to replay the requested effect.
7. Restart while `WAITING_APPROVAL`, `WAITING_USER_AUTH`, `WAITING_MFA` or `WAITING_EXTERNAL` preserves the wait and permits governed resume.
8. Cross-company run/work resume is rejected.
9. Generated UI, memory, worker assignment and capability discovery never grant execution authority.
10. User-visible success is emitted only from a verified outcome/evidence state, never from provider acknowledgement alone.

## Primary executable scenario

From the real Zero production entrypoint submit:

`Emma is sick tomorrow. Sort it out.`

The same scenario already passes Agent 4's backend convergence harness. Production Zero certification must now prove the front-door transport and projection layer reaches that governed path without bypasses.

## Failure variants

- approval required -> restart -> approve -> same run resumes -> one verified effect
- approval denied -> provider never called
- duplicate command/reconnect -> no duplicate business effect
- provider acknowledged but verifier fails -> Zero reports failure/remediation, not success
- wrong-company run/work identifier -> rejected
- process restart before first subscriber reconnect -> durable events/state remain recoverable

## Ownership

Agent 3 owns Zero production transport/runtime wiring. Agent 4 owns this release gate and the cross-system acceptance harness. Do not create a second runtime, workforce, decision engine or direct UI-to-provider execution path to satisfy this gate.
