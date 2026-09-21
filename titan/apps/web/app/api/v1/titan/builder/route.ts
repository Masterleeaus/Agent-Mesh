import { NextResponse, type NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { createTitanInterfaceRuntime, type InterfaceContext } from "@ai-fsm/titan-platform/interface-runtime";
import {
  TitanBuilderConversationCycle,
  TitanBuilderWorkspace,
  composeBuilderPresentation,
  previewBuilderThroughRuntimes,
  sanitizeBuilderProjection,
  type BuilderDocument,
  type BuilderNode,
} from "@ai-fsm/titan-platform/titan-builder";

export const dynamic = "force-dynamic";

type BuilderRequest = {
  operation?: "generate" | "preview" | "publish";
  message?: string;
  surface?: string;
  document?: BuilderDocument;
  preview_revision?: number;
  approved?: boolean;
  device?: "mobile" | "tablet" | "desktop";
};

function contextFor(session: { accountId: string; userId: string; traceId: string }, surface = "zero"): InterfaceContext {
  return createTitanInterfaceRuntime().createContext({
    company_id: session.accountId,
    user_id: session.userId,
    product_surface: surface,
    domain: "builder",
    roles: ["owner"],
    capabilities: ["titan.builder"],
    trace_id: session.traceId,
    correlation_id: session.traceId,
  });
}

function semanticComponents(message: string): BuilderNode[] {
  const q = message.toLowerCase();
  const nodes: BuilderNode[] = [
    { id: "assistant-thread", type: "chat-thread", props: { title: "Your Titan team", emptyText: "Ask the team what you need." } },
  ];
  if (/today|health|overview|metric|revenue|money|sales/.test(q)) {
    nodes.push({ id: "health-metric", type: "metric", props: { label: "Business health", value: "Live", supportingText: "Generated from governed business projections" } });
  }
  if (/schedule|job|booking|visit|calendar|today/.test(q)) {
    nodes.push({ id: "schedule", type: "schedule-board", props: { title: "Work coming up", density: "compact" } });
  }
  if (/customer|client|lead|quote|follow/.test(q)) {
    nodes.push({ id: "customer-card", type: "entity-card", props: { title: "Customer attention", description: "Priority customer work appears here." } });
  }
  if (nodes.length === 1) {
    nodes.push({ id: "workspace-card", type: "card", props: { title: "Generated workspace", body: message } });
  }
  return nodes;
}

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  try {
    const body = (await request.json()) as BuilderRequest;
    const operation = body.operation ?? "generate";
    const surface = String(body.surface ?? body.document?.surface ?? "zero");
    const context = contextFor(session, surface);

    if (operation === "generate") {
      const message = String(body.message ?? "").trim();
      if (!message) return NextResponse.json({ error: { code: "BUILDER_MESSAGE_REQUIRED" } }, { status: 400 });
      const cycle = TitanBuilderConversationCycle.fromChatRequest({
        company_id: session.accountId,
        surface,
        presentation_id: `builder-${session.traceId}`,
        message,
        purpose: message,
        semantic_components: semanticComponents(message),
        visual_hints: { visualTreatment: "default", motionPreset: "standard" },
      }, context);
      return NextResponse.json({
        data: cycle.snapshot(),
        companyBoundary: session.accountId,
        presentationOnly: true,
        authorityGranted: false,
      });
    }

    const document = body.document;
    if (!document) return NextResponse.json({ error: { code: "BUILDER_DOCUMENT_REQUIRED" } }, { status: 400 });
    if (document.company_id !== session.accountId) return NextResponse.json({ error: { code: "BUILDER_COMPANY_MISMATCH" } }, { status: 403 });

    if (operation === "preview") {
      const preview = previewBuilderThroughRuntimes({
        document,
        context,
        environment: { surface: document.surface, company_id: session.accountId, width: body.device === "mobile" ? 390 : body.device === "tablet" ? 720 : 1280, canvas: true, webgl: true, connectivity: "online" },
      });
      return NextResponse.json({ data: sanitizeBuilderProjection(preview), preview_revision: document.revision });
    }

    if (operation === "publish") {
      if (body.approved !== true) return NextResponse.json({ error: { code: "BUILDER_EXPLICIT_APPROVAL_REQUIRED" } }, { status: 409 });
      if (body.preview_revision !== document.revision) return NextResponse.json({ error: { code: "BUILDER_PREVIEW_STALE" } }, { status: 409 });
      const workspace = TitanBuilderWorkspace.restore(document);
      const published = workspace.publish();
      const presentation = composeBuilderPresentation(published.document, context);
      return NextResponse.json({
        data: { document: published.document, presentation },
        requiresDownstreamActionAuthorization: true,
        builderGrantsAuthority: false,
      });
    }

    return NextResponse.json({ error: { code: "BUILDER_OPERATION_UNSUPPORTED" } }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: { code: "BUILDER_REQUEST_FAILED", message: error instanceof Error ? error.message : "Builder request failed" } }, { status: 400 });
  }
});
