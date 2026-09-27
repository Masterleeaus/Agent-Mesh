# Integration Contract

## Dependencies
1. Existing Codee Runner / Multi-Step Plan state machine.
2. Codee Repository & Coding Intelligence Mega Pack v1.0.0 or equivalent receiver capabilities.
3. Codee MCP runtime supplied by the separate MCP agent when available.
4. Provider-routing pack is optional; until then `workforce.ai.request` remains a structured advisory request.

## Required receiver APIs
`registerManager`, `registerPrompts`, `registerSkills`, `registerProfiles`, `registerContextProvider`, `registerDiagnosticsSection`, `registerSettingsSection`.

## Optional receiver APIs
`registerWorkspacePage`, `requestRepositoryCapability`, `requestMcpCapability`, `requestProviderAssistance`, `requestPlanDraft`, `requestGovernedMutation`.

## Manager output contracts
Managers return evidence, recommendations, tool requests, governed mutation requests, verification requests, handoffs, and plan-start drafts. They never return an instruction that directly marks a Codee plan step complete.

## Governed mutation invariant
A manager may request a mutation. The receiver must route it through the privileged host/Titan MCP mutation pipeline. A verified backup receipt is mandatory before the mutation executes. Failure to create or verify backup blocks execution.
