import type { TitanCapability } from "./contracts";
import { listTitanMcpTools } from "./mcp-client";

export type TitanCapabilityBinding = {
  capability: TitanCapability;
  tool: string;
  mode: "dispatcher" | "direct";
};

function parseToolMap(): Partial<Record<TitanCapability, string>> {
  const raw = process.env.TITAN_MCP_CAPABILITY_TOOL_MAP?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string" && value.length > 0)) as Partial<Record<TitanCapability, string>>;
  } catch {
    throw new Error("TITAN_MCP_CAPABILITY_TOOL_MAP must be valid JSON");
  }
}

export async function resolveCapabilityBinding(capability: TitanCapability): Promise<TitanCapabilityBinding | null> {
  const tools = await listTitanMcpTools();
  const available = new Set(tools.map((tool) => tool.name));
  const dispatcher = process.env.TITAN_MCP_DISPATCH_TOOL?.trim();
  if (dispatcher) {
    if (!available.has(dispatcher)) throw new Error(`Configured Titan MCP dispatcher '${dispatcher}' is not in tools/list`);
    return { capability, tool: dispatcher, mode: "dispatcher" };
  }

  const mapped = parseToolMap()[capability];
  if (!mapped) return null;
  if (!available.has(mapped)) throw new Error(`Configured Titan MCP tool '${mapped}' for '${capability}' is not in tools/list`);
  return { capability, tool: mapped, mode: "direct" };
}

export async function titanMcpBindingStatus(capabilities: readonly TitanCapability[]) {
  const tools = await listTitanMcpTools();
  const available = new Set(tools.map((tool) => tool.name));
  const dispatcher = process.env.TITAN_MCP_DISPATCH_TOOL?.trim();
  const map = parseToolMap();
  return capabilities.map((capability) => {
    const configured = dispatcher || map[capability] || null;
    return { capability, configured_tool: configured, available: Boolean(configured && available.has(configured)) };
  });
}
