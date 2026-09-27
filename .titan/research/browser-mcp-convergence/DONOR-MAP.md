# Donor / Convergence Map

| Capability | Decision | Result |
|---|---|---|
| Titan canonical tool registry | KEEP | `packages/tools` remains sole registry authority. |
| Titan authority evaluator / leases | KEEP + CONNECT | Gateway consumes authority result; does not grant authority. |
| Titan provenance/evidence | KEEP + CONNECT | Gateway emits evidence to injected canonical sink. |
| OpenAcme BrowserManager lifecycle | AUGMENT | Adopt provider/session lifecycle ideas, not per-agent-only ownership. |
| OpenAcme local Chrome/Playwright | AUGMENT | Browser Node contract is local-first and provider-neutral; concrete Playwright adapter can follow behind it. |
| Browserbase / Browser-Use / Firecrawl | CONNECT optional | Cloud providers remain optional, never mandatory. |
| OpenAcme accessibility snapshots/stable tabs | AUGMENT | Recommended for concrete Browser Node executor. |
| OpenAcme MCP lifecycle/retry/status | AUGMENT | MCP adapter contract preserves lifecycle separation; concrete transport client may adapt these patterns. |
| OpenAcme MCP OAuth handoff | CONNECT | Use Titan credential/auth handles; OAuth does not grant action authority. |
| OpenAcme direct MCP tool registry naming | REPLACE at policy boundary | External names map to stable Titan capabilities before policy/execution. |
| Per-agent-only browser ownership | REPLACE | Titan supports personal/agent/team/company/ephemeral scopes. |
| Any direct agent→browser/MCP consequential execution | RETIRE / forbid | All consequential execution enters ExecutionGateway after Decision/Risk/Authority. |

## Licence
OpenAcme repository reports MIT licence. No donor source file was copied verbatim in this implementation; contracts were independently implemented from observed behaviours and Titan requirements.
