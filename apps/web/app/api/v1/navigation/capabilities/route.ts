import { NextResponse } from "next/server";
import { buildBusinessOpsBootstrap } from "@ai-fsm/domain";
import { getSession } from "@/lib/auth/session";
import { portableQueryOne } from "@/lib/db/portable";

export const dynamic = "force-dynamic";

type AccountCapabilityRow = { id: string; name: string | null };

/**
 * Backward-compatible discovery endpoint for Titan shells.
 * New shells should prefer /api/v1/bootstrap, which includes the same shared
 * contracts plus the authenticated tenant/session envelope in one response.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const account = await portableQueryOne<AccountCapabilityRow>(
    `SELECT id, name FROM accounts WHERE id = $1`,
    [session.accountId],
  );

  const bootstrap = buildBusinessOpsBootstrap({
    userId: session.userId,
    accountId: session.accountId,
    accountName: account?.name ?? null,
    role: session.role,
  });

  return NextResponse.json({
    product: bootstrap.product,
    contractVersion: bootstrap.navigation.contractVersion,
    standalone: bootstrap.standalone,
    extensionRequired: bootstrap.extensionRequired,
    role: bootstrap.session.role,
    authority: bootstrap.authority,
    routes: bootstrap.navigation.routes,
    commands: bootstrap.commands,
    launch: bootstrap.launch,
    bootstrap: {
      endpoint: "/api/v1/bootstrap",
      contractVersion: bootstrap.bootstrapVersion,
    },
  });
}
