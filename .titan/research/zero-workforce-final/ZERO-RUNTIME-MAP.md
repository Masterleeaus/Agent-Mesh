# Zero to runtime map

| Stage | Current implementation | Missing production seam |
| --- | --- | --- |
| One / Zero | `/app/zero`, session role and account scope | Authenticated chat transport and actor-bound conversation |
| Interaction | `TitanInteractionClient` supports transport, continuation and scoped events in the demo tree | Real transport on the production Zero route |
| Context | `TitanAgentRuntime` accepts `contextProvider.load` per turn | Governed company/user/agent/task retrieval adapter |
| Work / workforce | `services/workforce` WorkItem and digital wake adapter | Production service assembly and conversation/work correlation |
| Persistent run | `TitanAgentRuntime.start/resume/recover`; SQLite run store | Server-owned instance, durable event delivery and subscribe-before-dispatch |
| Decision / execution | Injected `authorityGateway` | Bind existing Decision/Risk/Authority/ExecutionGateway, never a direct UI tool call |
| Result | Runtime events and verified tool result check | Authenticated scoped projection to Zero with evidence/outcome identifiers |

Required IDs: `company_id`, `actor_id`, `conversation_id`, `work_id`, `run_id`, `agent_id`, `decision_id`, `execution_id`, `evidence_id`, outcome reference. The runtime presently emits a subset; the web route must not manufacture missing correlations.
