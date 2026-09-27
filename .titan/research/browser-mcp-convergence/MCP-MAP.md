# MCP Map

Canonical adapter: `packages/tools/mcp-provider-contract.mjs`.

External MCP tools are discovered with schemas and explicit `authorised: false`. A configured mapping converts provider-specific names to stable Titan capabilities before policy. Company-scoped provider wrappers invoke the MCP client only through ExecutionGateway.

OpenAcme donor implementation supports stdio, SSE and Streamable HTTP; retained server status; retry/backoff; OAuth handoff; token-store hooks; safe environment/error/description handling. These are suitable behaviours for a future concrete Titan MCP transport adapter, but transport connectivity must not become a second authority model.
