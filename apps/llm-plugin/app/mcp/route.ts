import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { titanCapabilities } from "@/lib/titan/contracts";
import { resolveTitanContext } from "@/lib/titan/context";
import { invokeTitan } from "@/lib/titan/gateway";

const getWidgetHtml = async (path: string) => (await fetch(`${baseURL}${path}`)).text();
const widget = { id: "titan_zero", title: "Titan Zero", templateUri: "ui://widget/titan-zero.html", invoking: "Asking Titan…", invoked: "Titan responded", description: "Titan Zero business command surface" };
const meta = { "openai/outputTemplate": widget.templateUri, "openai/toolInvocation/invoking": widget.invoking, "openai/toolInvocation/invoked": widget.invoked, "openai/widgetAccessible": true, "openai/resultCanProduceWidget": true } as const;
const capabilitySchema = z.enum(titanCapabilities);
const operationSchema = z.enum(["query", "prepare", "confirm", "create", "update", "cancel", "authority_status", "request_autonomy", "upgrade_options"]);

const handler = createMcpHandler(async (server) => {
  const html = await getWidgetHtml("/");
  server.registerResource("titan-zero-widget", widget.templateUri, { title: widget.title, description: widget.description, mimeType: "text/html+skybridge", _meta: { "openai/widgetDescription": widget.description, "openai/widgetPrefersBorder": true } }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/html+skybridge", text: `<html>${html}</html>`, _meta: { "openai/widgetDescription": widget.description, "openai/widgetPrefersBorder": true, "openai/widgetDomain": baseURL } }] }));

  server.registerTool("titan_zero", {
    title: "Ask Titan Zero",
    description: "Query or request governed Titan Zero work, inspect responsibility-specific autonomy, request an autonomy change, or inspect upgrade eligibility. Identity, entitlement, trust and authority remain Titan server-authoritative.",
    inputSchema: {
      request: z.string().optional(),
      capability: capabilitySchema.optional(),
      operation: operationSchema.optional(),
      payload: z.record(z.unknown()).optional().describe("Structured fields for the requested Titan capability"),
    },
    _meta: meta,
  }, async ({ request, capability, operation, payload }) => {
    const selectedCapability = capability ?? "ask_titan";
    const context = await resolveTitanContext();
    if (!context) return {
      content: [{ type: "text", text: "Connect Titan Zero to continue. A trusted Titan session is required." }],
      structuredContent: {
        surface: "chatgpt",
        capability: selectedCapability,
        status: "authentication_required",
        contextRequired: ["trusted_titan_session"],
        callerSuppliedIdentityAccepted: false,
        mutationAttempted: false,
      },
      _meta: meta,
    };

    try {
      const receipt = await invokeTitan({ capability: selectedCapability, operation: operation ?? "query", request: request ?? null, payload, context });
      return {
        content: [{ type: "text", text: receipt.message }],
        structuredContent: {
          surface: "chatgpt",
          company_id: context.company_id,
          operation: operation ?? "query",
          ...receipt,
        },
        _meta: meta,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Titan could not complete that request. No ungoverned fallback was attempted." }],
        structuredContent: {
          surface: "chatgpt",
          capability: selectedCapability,
          trace_id: context.trace_id,
          status: "gateway_error",
          mutationAttemptedOutsideTitan: false,
          error: error instanceof Error ? error.message : "unknown_error",
        },
        _meta: meta,
      };
    }
  });
});

export const GET = handler;
export const POST = handler;
