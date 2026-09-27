# Canonical Work Lifecycle

```text
CREATED --deps satisfied--> READY --> CLAIMED --> IN_PROGRESS
   |                         |                     |
   +--deps pending--> BLOCKED                      +--> BLOCKED
                                                  +--> WAITING
                                                  +--> WAITING_APPROVAL
                                                  +--> WAITING_EXTERNAL
                                                  +--> COMPLETED
                                                  +--> FAILED
```

`CANCELLED` is allowed from every non-terminal operational state. Waiting/blocked states return to READY only through an explicit resume/readiness event. Terminal states cannot be delegated or restarted.

## Dependencies

Dependencies are work IDs within the same `company_id`. Missing cross-company IDs are indistinguishable from absent work. Creation walks prerequisite ancestry and rejects cycles. Completing a prerequisite re-evaluates direct dependants.

## Claiming

Only READY work can be claimed. Direct assignments constrain the claimant. Claiming records lease metadata so the Agent 1 storage/dispatcher integration can later recover abandoned claims without distributed consensus.

## Authority

An authority requirement is declarative. `AuthorityAdapter.isSatisfied` asks Titan's existing authority boundary whether the already-existing envelope permits the worker. A negative check moves work to `WAITING_APPROVAL`; assignment, delegation, registration, activation and orchestration never mutate authority.

## Waiting and wake

A worker can yield into WAITING, WAITING_EXTERNAL or WAITING_APPROVAL. Signal/approval/external-response adapters call `resume`, which moves work to READY and wakes Agent 2 through `AgentRuntimeAdapter`.
