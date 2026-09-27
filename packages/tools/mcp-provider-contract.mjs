import { EXECUTION_CLASSES, ExecutionError } from './execution-gateway.mjs';

/**
 * Adapts external MCP tools into Titan capabilities. Discovery is not authority:
 * every invocation still enters ExecutionGateway with an approved authority result.
 */
export class McpCapabilityAdapter {
  constructor({ company_id, serverId, client, mappings = {}, verifyOutcome }) {
    if (!company_id || !serverId || !client) throw new ExecutionError('INVALID_MCP_ADAPTER', 'MCP adapter requires company_id, serverId and client');
    this.company_id = company_id;
    this.serverId = serverId;
    this.client = client;
    this.mappings = new Map(Object.entries(mappings));
    this.verifyOutcome = verifyOutcome;
  }

  async discover() {
    const tools = await this.client.listTools();
    return tools.map((tool) => ({
      server: this.serverId,
      external_tool: tool.name,
      capability: this.mappings.get(tool.name) ?? null,
      input_schema: tool.inputSchema ?? {},
      discovered: true,
      authorised: false,
    }));
  }

  providerFor(capability, externalTool) {
    if (this.mappings.get(externalTool) !== capability) throw new ExecutionError('MCP_MAPPING_REQUIRED', 'MCP tool must map to a stable Titan capability');
    return {
      id: `mcp:${this.serverId}:${externalTool}`,
      company_id: this.company_id,
      executionClass: EXECUTION_CLASSES.CONNECTED,
      capabilities: [capability],
      execute: async (request) => {
        if (request.company_id !== this.company_id) throw new ExecutionError('MCP_COMPANY_SCOPE', 'MCP server is scoped to another company');
        const result = await this.client.callTool(externalTool, request.input ?? {}, { signal: request.signal, timeout: request.timeout_ms });
        if (!result || typeof result !== 'object' || result.isError === true) throw new ExecutionError('MCP_PROVIDER_FAILURE', 'MCP tool failed or returned a malformed result');
        return {
          external_ref: result?.requestId ?? result?.id ?? null,
          acknowledgement: true,
        };
      },
      verify: async (raw, request) => {
        if (typeof this.verifyOutcome !== 'function') return false;
        return this.verifyOutcome({ capability, externalTool, external_ref: raw.external_ref, request, client: this.client });
      },
    };
  }
}
