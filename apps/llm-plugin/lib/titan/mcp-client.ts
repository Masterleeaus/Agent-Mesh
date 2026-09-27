import { z } from "zod";

const mcpToolSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  inputSchema: z.record(z.unknown()).optional(),
  annotations: z.record(z.unknown()).optional(),
  _meta: z.record(z.unknown()).optional(),
});

const initializeResultSchema = z.object({
  protocolVersion: z.string(),
  serverInfo: z.object({ name: z.string(), version: z.string() }),
  capabilities: z.record(z.unknown()),
  _meta: z.record(z.unknown()).optional(),
});

const toolsListResultSchema = z.object({ tools: z.array(mcpToolSchema) });
const toolCallResultSchema = z.object({
  content: z.array(z.record(z.unknown())).optional(),
  structuredContent: z.record(z.unknown()).optional(),
  isError: z.boolean().optional(),
});

const rpcEnvelopeSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  result: z.unknown().optional(),
  error: z.object({ code: z.number(), message: z.string() }).optional(),
});

export type TitanMcpTool = z.infer<typeof mcpToolSchema>;

function config() {
  const url = process.env.TITAN_MCP_URL?.trim();
  const token = process.env.TITAN_MCP_TOKEN?.trim();
  return { url: url || null, token: token || null };
}

async function rpc(method: string, params?: Record<string, unknown>) {
  const { url, token } = config();
  if (!url) throw new Error("TITAN_MCP_URL is not configured");
  const id = `chatgpt:${crypto.randomUUID()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
      "MCP-Protocol-Version": "2025-03-26",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params: params ?? {} }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Titan MCP HTTP ${response.status}`);
  const envelope = rpcEnvelopeSchema.parse(body);
  if (envelope.error) throw new Error(`Titan MCP ${envelope.error.code}: ${envelope.error.message}`);
  return envelope.result;
}

export async function initializeTitanMcp() {
  return initializeResultSchema.parse(await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "Titan Zero ChatGPT App", version: "0.1.0-mvp" },
  }));
}

export async function listTitanMcpTools(): Promise<TitanMcpTool[]> {
  return toolsListResultSchema.parse(await rpc("tools/list")).tools;
}

export async function callTitanMcpTool(name: string, args: Record<string, unknown>) {
  return toolCallResultSchema.parse(await rpc("tools/call", { name, arguments: args }));
}
