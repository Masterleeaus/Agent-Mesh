# Provider map

| Provider | Current implementation | Live business binding |
| --- | --- | --- |
| Native | Gateway accepts registered native provider | None established in `packages/tools` |
| MCP | Mapped tool discovery and call with signal/timeout options | No configured client or provider-independent resource reread |
| Browser Node | Session/company/domain checks and injected executor | No concrete production executor bound to this contract |
| Communications | Separate web/worker paths | Not wired to this gateway in current main |

Discovery advertises availability only and cannot grant authority.
