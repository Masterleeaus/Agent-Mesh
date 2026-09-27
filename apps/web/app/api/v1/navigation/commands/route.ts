import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  BUSINESS_OPS_COMMAND_IDS,
  BUSINESS_OPS_COMMAND_VERSION,
  canBusinessOpsAction,
  resolveBusinessOpsCommand,
  type BusinessOpsCommandRequest,
} from "@ai-fsm/domain";
import { getSession } from "@/lib/auth/session";
import { withTenantTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";

export const dynamic = "force-dynamic";

function isCommandId(value: unknown): value is BusinessOpsCommandRequest["commandId"] {
  return typeof value === "string" && (BUSINESS_OPS_COMMAND_IDS as readonly string[]).includes(value);
}

function parseCommand(body: unknown): BusinessOpsCommandRequest {
  if (!body || typeof body !== "object") throw new Error("Invalid command payload");
  const candidate = body as Record<string, unknown>;
  if (!isCommandId(candidate.commandId)) throw new Error("Unknown Business Ops command");

  // The shared resolver performs destination/id validation. Keep parsing here
  // intentionally narrow so callers cannot inject requiredAction or href.
  return candidate as unknown as BusinessOpsCommandRequest;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  let command: BusinessOpsCommandRequest;
  try {
    command = parseCommand(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INVALID_COMMAND", message: error instanceof Error ? error.message : "Invalid command" } },
      { status: 400 },
    );
  }

  let resolved;
  try {
    resolved = resolveBusinessOpsCommand(command);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INVALID_COMMAND", message: error instanceof Error ? error.message : "Invalid command" } },
      { status: 400 },
    );
  }

  if (resolved.requiredAction && !canBusinessOpsAction(session.role, resolved.requiredAction)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You do not have permission to use this Business Ops command" } },
      { status: 403 },
    );
  }

  const commandRequestId = randomUUID();
  await withTenantTransaction(session, async (client, accountId) => {
    await appendAuditLog(client, {
      account_id: accountId,
      entity_type: "business_ops_command",
      entity_id: commandRequestId,
      action: "insert",
      actor_id: session.userId,
      new_value: {
        commandId: resolved.commandId,
        contractVersion: resolved.contractVersion,
        requiredAction: resolved.requiredAction,
        href: resolved.href,
        mode: resolved.mode,
      },
    });
  });

  return NextResponse.json({
    commandRequestId,
    contractVersion: BUSINESS_OPS_COMMAND_VERSION,
    command: resolved,
    enforcement: "server-routes-remain-authoritative",
  });
}
