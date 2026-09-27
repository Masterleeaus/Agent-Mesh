# Titan Zero Final E2E Scenarios

These scenarios are verification requirements, not claims of implemented behaviour.

## E2E-01 — Worker absence recovery

User: `Emma is sick tomorrow. Sort it out.`

Required proof:
1. company-scoped user/context resolution;
2. affected future visits identified from canonical state;
3. governed WorkItem exists;
4. capable replacement selected without treating assignment as authority;
5. persistent Agent Runtime correlates conversation/work/run;
6. Decision/Risk/Authority gate any consequential schedule change;
7. ExecutionGateway performs the action once;
8. canonical visit is independently re-read;
9. evidence is persisted;
10. completed WorkItem references the evidence;
11. persisted state survives database close/reopen;
12. another company cannot read the WorkItem or run;
13. Zero ultimately presents the verified outcome rather than an inferred success.

Current Pass 3 status: **FAIL** on current main because persistent runtime does not correctly continue after verified tool execution. Agent 1 PR #801 owns the bounded runtime repair.

## E2E-02 — Approval and resume

User: `Move Mrs Smith's clean to Friday and tell her.`

Required proof:
- consequential change reaches canonical authority decision;
- WAITING_APPROVAL persists;
- process/database restart does not lose the request;
- approval resumes the same run/tool execution, not a model replay;
- schedule is independently verified;
- communication outcome is verified and evidenced.

## E2E-03 — Qualified cover

User: `Find someone qualified to cover the 9am clean.`

Required proof:
- availability and capability filtering;
- human/digital distinction;
- no authority granted by capability/assignment;
- no replacement path returns an explicit exception/escalation rather than fabricated success.

## E2E-04 — Service recovery

User: `Customer says the bathroom wasn't cleaned properly. Fix it.`

Required proof:
- customer/job/property context retrieval;
- complaint becomes governed work;
- evidence and prior scope are distinguished from inference;
- remedial action follows policy/authority;
- communication and resulting business state are verified.

## E2E-05 — Overdue invoices

User: `Follow up all overdue invoices.`

Required proof:
- company-scoped overdue invoice selection;
- communication quiet-hours/provider policy respected;
- duplicate user request does not send duplicate follow-ups;
- provider acknowledgement alone is not considered delivered/verified.

## E2E-06 — Recurring service

User: `Schedule this customer fortnightly.`

Required proof:
- correct customer/property/context identity;
- recurrence represented canonically;
- authority evaluated before schedule mutation;
- generated occurrences do not duplicate after retry/restart.

## E2E-07 — Daily owner attention

User: `What needs my attention today?`

Required proof:
- live canonical projections only;
- attention, jobs, exceptions, active/waiting workers and approvals are company scoped;
- no fabricated pulse values;
- read-only presentation cannot grant authority.

## Mandatory failure variants

Every final certification run must include:
- no replacement available;
- replacement lacks capability;
- approval denied;
- approval accepted;
- authority revoked while waiting;
- provider unavailable;
- MCP/browser timeout;
- MFA/user authentication required;
- post-action verification failure;
- communication failure;
- duplicate user message;
- duplicate execution attempt;
- runtime/process restart;
- database close/reopen;
- cancellation;
- cross-company access attempt.
