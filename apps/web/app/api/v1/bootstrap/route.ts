import { NextResponse } from "next/server";
import { buildBusinessOpsBootstrap } from "@ai-fsm/domain";
import { getTitanPlatformDescriptor, TITAN_BUSINESS_OPS_AGENT_COMMANDS } from "@ai-fsm/titan-platform";
import { getSession } from "@/lib/auth/session";
import { portableQueryOne } from "@/lib/db/portable";

export const dynamic = "force-dynamic";

type AccountBootstrapRow = {
  id: string;
  name: string | null;
};

/**
 * Canonical authenticated shell bootstrap for standalone Business Ops and
 * optional Titan shells. It deliberately returns contracts and tenant identity
 * only; operational record data remains behind normal tenant-scoped APIs.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const account = await portableQueryOne<AccountBootstrapRow>(
    `SELECT id, name FROM accounts WHERE id = $1`,
    [session.accountId],
  );

  if (!account) {
    return NextResponse.json(
      { error: { code: "ACCOUNT_NOT_FOUND", message: "Business account not found" } },
      { status: 404 },
    );
  }

  const businessOps = buildBusinessOpsBootstrap({
    userId: session.userId,
    accountId: session.accountId,
    accountName: account.name,
    role: session.role,
  });

  return NextResponse.json({
    ...businessOps,
    titanPlatform: {
      ...getTitanPlatformDescriptor(),
      workforce: {
        commandEndpoint: "/api/v1/titan/workforce/commands",
        nativeCommandCount: TITAN_BUSINESS_OPS_AGENT_COMMANDS.length,
        browserExtensionRequired: false,
      },
    },
  });
}
