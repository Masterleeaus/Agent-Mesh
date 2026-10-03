import { redirect } from "next/navigation";
import type { Route } from "next";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getDatabaseDialect } from "@/lib/db/dialect";
import { withTenantTransaction } from "@/lib/db/portable";
import { businessToday } from "@/lib/operations/business-day";
import { AppShell } from "@/components/AppShell";
import {
  CAPTURE_PATH,
  loginRedirectForPath,
  pathnameFromHeaders,
} from "@/lib/auth/post-login-destination";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = pathnameFromHeaders(headerList);
  const session = await getSession();
  // Known standalone app paths can round-trip safely through /login?next=.
  if (!session) redirect(loginRedirectForPath(pathname) as Route);

  if (pathname === CAPTURE_PATH) {
    return <>{children}</>;
  }

  const { userName, reviewPending } = await withTenantTransaction(session, async (client, accountId) => {
    const dialect = getDatabaseDialect();
    const [users, reviewRows] = await Promise.all([
      client.query<{ full_name: string }>(
        dialect === "sqlite"
          ? `SELECT full_name FROM users WHERE id = $1 AND company_id = $2`
          : `SELECT u.full_name FROM business_memberships bm
              JOIN users u ON u.id = bm.user_id
             WHERE bm.user_id = $1 AND bm.account_id = $2 AND bm.status = 'active'`,
        [session.userId, accountId],
      ),
      dialect === "sqlite"
        ? Promise.resolve({ rows: [] as { pending: boolean }[] })
        : client.query<{ pending: boolean }>(
            `SELECT (review_prompted_at IS NOT NULL AND closed_at IS NULL) AS pending
               FROM business_days
              WHERE account_id = $1 AND business_date = $2`,
            [accountId, businessToday()],
          ),
    ]);
    return {
      userName: users.rows[0]?.full_name ?? "",
      reviewPending: reviewRows.rows[0]?.pending ?? false,
    };
  });

  return (
    <AppShell role={session.role} userName={userName} reviewPending={reviewPending}>
      {children}
    </AppShell>
  );
}
