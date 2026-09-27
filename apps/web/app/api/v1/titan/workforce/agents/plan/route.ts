import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getTitanBusinessOpsAgentProfile,
  planTitanNativeAgent,
  type TitanNativeAgentPlanInput,
} from "@ai-fsm/titan-platform/native-agents";

export const dynamic = "force-dynamic";

type SupportedAgentKey = TitanNativeAgentPlanInput["agentKey"];
const SUPPORTED = new Set<SupportedAgentKey>(["dispatch", "invoicing", "rebooking", "quote", "crm"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  try {
    const raw = (await request.json()) as { agentKey?: string; payload?: Record<string, unknown> };
    const agentKey = String(raw?.agentKey ?? "").trim().toLowerCase() as SupportedAgentKey;
    if (!SUPPORTED.has(agentKey)) {
      return NextResponse.json({ error: { code: "UNSUPPORTED_NATIVE_AGENT" } }, { status: 400 });
    }
    const profile = getTitanBusinessOpsAgentProfile(agentKey);
    if (!profile) return NextResponse.json({ error: { code: "UNKNOWN_AGENT_PROFILE" } }, { status: 400 });

    const payload = { ...(raw.payload ?? {}) } as Record<string, unknown>;
    // Server-side company authority always wins over supplied agent payload.
    if (agentKey === "dispatch" || agentKey === "invoicing" || agentKey === "rebooking") {
      payload.company_id = session.accountId;
      if (agentKey === "dispatch" && payload.job && typeof payload.job === "object") {
        payload.job = { ...(payload.job as Record<string, unknown>), company_id: session.accountId };
      }
    }

    const plan = planTitanNativeAgent({ agentKey, payload } as TitanNativeAgentPlanInput);
    return NextResponse.json({
      data: plan,
      agent: profile,
      companyBoundary: session.accountId,
      commandExecutionEndpoint: "/api/v1/titan/workforce/commands",
      authority: "native-business-ops-routes",
      browserExtensionRequired: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "AGENT_PLAN_FAILED", message: error instanceof Error ? error.message : "Agent planning failed" } },
      { status: 400 },
    );
  }
}
