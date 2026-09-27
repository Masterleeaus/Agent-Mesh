# Canonical Work Item & Lifecycle

`WorkItem` is Titan's internal Advanced Intelligence workforce unit. It is deliberately not a customer field-service job, workflow, decision or execution record.

Core fields: `companyId`, `workId`, `parentWorkId`, objective/description, creator, assignee/team, priority, state, dependencies, required capabilities, authority requirement, context refs, evidence refs, result, wait signal, claim owner and timestamps.

```text
CREATED --dependencies satisfied--> READY --claim--> CLAIMED --start--> IN_PROGRESS
   |                                  |                              |
   |                                  +--> WAITING_APPROVAL          +--> BLOCKED
   |                                                                 +--> WAITING
   |                                                                 +--> WAITING_APPROVAL
   |                                                                 +--> WAITING_EXTERNAL
   |                                                                 +--> COMPLETED
   |                                                                 +--> FAILED
   +---------------------------------------------------------------> CANCELLED
```

Waiting/blocking states resume to READY, clearing the prior claim so work can be safely reclaimed. Terminal states are immutable.

## Dependencies

Edges are `work_id -> depends_on_work_id`, scoped by `company_id`. A created work item becomes READY only when every prerequisite is COMPLETED. New edges are checked for reachability before insertion; self/circular dependencies fail.

## Claiming

Claiming is a conditional `UPDATE ... WHERE state='READY'` inside Agent 1's SQLite `BEGIN IMMEDIATE` transaction. This is sufficient for local SQLite concurrency and avoids distributed-consensus machinery.

## Delegation and authority

Decomposition creates child work with the manager as creator and emits `work.delegated`. Parent authority is never copied to children unless an explicit child requirement is separately declared. Assignment/delegation does not create execution permission.

## Dispatcher

`dispatchReady()` selects READY work, resolves an assigned or capability-eligible digital worker, claims it, emits wake/start events and calls the Agent 2 adapter. Runtime outcomes map back to COMPLETED / WAITING* / FAILED. Human workers are never invoked through the digital runtime.
