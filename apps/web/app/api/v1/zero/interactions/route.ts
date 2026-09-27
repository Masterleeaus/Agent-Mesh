import { NextRequest, NextResponse } from "next/server";
import { createZeroInteraction } from "@titan-zero/titan-platform/runtime";
import { getSession } from "@/lib/auth/session";
import { dispatchZeroRuntime } from "@/lib/zero/runtime-dispatch";

export const dynamic = "force-dynamic";

type Body = {
  company_id?: string;
  conversation_id?: string;
  surface?: string;
  text?: string;
  client_message_id?: string;
  requested_agent_id?: string;
  continuation_token?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const company_id = String(body.company_id ?? "").trim();
  const conversation_id = String(body.conversation_id ?? "").trim();
  const text = String(body.text ?? "").trim();
  const client_message_id = String(body.client_message_id ?? "").trim();
  const requested_agent_id = String(body.requested_agent_id ?? "").trim() || undefined;
  const continuation_token = String(body.continuation_token ?? "").trim() || undefined;

  if (!company_id || !conversation_id || !text || !client_message_id) {
    return NextResponse.json({ error: "Missing required interaction fields" }, { status: 400 });
  }
  if (body.surface !== "zero") {
    return NextResponse.json({ error: "Zero surface required" }, { status: 400 });
  }
  if (company_id !== session.accountId) {
    return NextResponse.json({ error: "Cross-company interaction rejected" }, { status: 403 });
  }

  try {
    createZeroInteraction({
      company_id,
      surface: "zero",
      interaction_id: client_message_id,
      conversation_id,
      modality: "text",
      text,
      context_refs: [],
      referent_refs: [],
    });

    const result = await dispatchZeroRuntime({
      company_id,
      actor_id: session.userId,
      conversation_id,
      interaction_id: client_message_id,
      client_message_id,
      text,
      correlation_id: client_message_id,
      requested_agent_id,
      continuation_token,
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ZERO_RUNTIME_UNAVAILABLE") {
      return NextResponse.json({ error: "Zero runtime is not available", code }, { status: 503 });
    }
    return NextResponse.json({ error: "Zero interaction rejected" }, { status: 400 });
  }
}
