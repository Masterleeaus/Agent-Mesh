# Findings

## Browser Node
Execution surface, not authority. Sessions are company-scoped and have explicit ownership: personal, agent, team, company or ephemeral. A concrete local Playwright executor should persist only protected profile/session references through Agent 1 storage contracts. Page text/DOM/screenshots are untrusted external input and cannot redefine policy, credentials, authority or company scope.

## MCP
MCP servers are connected providers. Discovery records schemas and availability but `authorised=false`. Each external tool requires an explicit mapping to a Titan capability. Invocation occurs only after canonical Decision/Risk/Authority approval.

## Execution Gateway
One provider-neutral gateway distinguishes native, connected and operated implementations. Routing prefers native → connected → operated unless a caller supplies a different allowed preference. Provider selection is company-scoped. Consequential completion requires outcome verification and produces evidence. Interaction without verified business outcome is a failure, not success.

## Credentials
Requests may carry credential handles only. Raw `secret`, `token` or `password` material is rejected by the gateway contract. Provider implementations resolve handles outside model-visible prompts/logs/evidence.

## Recovery
Structured states include `WAITING_APPROVAL`, `WAITING_USER_AUTH`, `WAITING_MFA`, `FAILED`, `DENIED`, `SUCCEEDED`. `work_id`, `agent_id`, `company_id` and `execution_id` flow into evidence for runtime/task resume integration.

## Remaining concrete integration
A production Playwright adapter, persisted Browser Node session repository, concrete MCP SDK transport adapter, canonical evidence-sink binding and runtime Command Bus binding should be wired after Agent 1/2 contracts stabilise. Those should implement these contracts rather than create alternate registries or authority paths.
