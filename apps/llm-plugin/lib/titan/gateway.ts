import type { TitanCapabilityRequest, TitanReceipt } from "./contracts";
import { resolveCapabilityBinding } from "./catalogue";
import { callTitanMcpTool, initializeTitanMcp } from "./mcp-client";
import { titanReceiptSchema } from "./schemas";
import { createHash, randomUUID } from "node:crypto";

function unbound(request: TitanCapabilityRequest, message: string): TitanReceipt {
  return {
    receipt_id: `unbound:${request.context.trace_id}`,
    trace_id: request.context.trace_id,
    capability: request.capability,
    status: "requires_backend_binding",
    authority_path: "risk>shield>governance>autonomy>command_bus",
    message,
  };
}

export async function invokeTitan(request: TitanCapabilityRequest): Promise<TitanReceipt> {
  const correlation_id = request.execution?.correlation_id ?? randomUUID();
  const idempotency_key = request.execution?.idempotency_key ?? createHash("sha256").update([request.context.company_id, request.context.actor_id, request.capability, request.operation ?? "query", JSON.stringify(request.payload ?? {})].join(":"), "utf8").digest("hex");
  request = { ...request, execution: { correlation_id, causation_id: request.execution?.causation_id, idempotency_key } };
  if (!process.env.TITAN_MCP_URL?.trim()) {
    return unbound(request, "Titan MCP is not configured. No business mutation was attempted.");
  }

  await initializeTitanMcp();
  const binding = await resolveCapabilityBinding(request.capability);
  if (!binding) {
    return unbound(request, `Titan MCP is connected but '${request.capability}' has no canonical tool binding. No business mutation was attempted.`);
  }

  const args = binding.mode === "dispatcher"
    ? { capability: request.capability, operation: request.operation ?? "query", request: request.request, payload: request.payload ?? {}, context: request.context }
    : { operation: request.operation ?? "query", request: request.request, payload: request.payload ?? {}, context: request.context };

  const result = await callTitanMcpTool(binding.tool, args);
  if (result.isError) throw new Error(`Titan MCP tool '${binding.tool}' returned an error`);
  if (!result.structuredContent) throw new Error(`Titan MCP tool '${binding.tool}' returned no structuredContent`);
  const receipt = titanReceiptSchema.parse(result.structuredContent);
  if (receipt.trace_id !== request.context.trace_id) throw new Error("Titan receipt trace_id does not match authenticated request context");
  if (receipt.correlation_id && receipt.correlation_id !== correlation_id) throw new Error("Titan receipt correlation_id does not match execution envelope");
  return receipt;
}
