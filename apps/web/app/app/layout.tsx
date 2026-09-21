import { redirect } from "next/navigation";
import type { Route } from "next";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { portableQuery } from "@/lib/db/portable";
import { businessToday } from "@/lib/operations/business-day";
import { AppShell } from "@/components/AppShell";
import {
  CAPTURE_PATH,
  loginRedirectForPath,
  pathnameFromHeaders,
  requestTargetFromHeaders,
} from "@/lib/auth/post-login-destination";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = pathnameFromHeaders(headerList);
  const requestTarget = requestTargetFromHeaders(headerList);
  const session = await getSession();
  // Known standalone app paths can round-trip safely through /login?next=.
  if (!session) redirect(loginRedirectForPath(requestTarget) as Route);

  if (pathname === CAPTURE_PATH) {
    return <>{children}</>;
  }

  const [users, reviewRows] = await Promise.all([
    portableQuery<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1 AND account_id = $2`,
      [session.userId, session.accountId],
    ),
    portableQuery<{ pending: boolean }>(
      `SELECT (review_prompted_at IS NOT NULL AND closed_at IS NULL) AS pending
       FROM business_days
       WHERE account_id = $1 AND business_date = $2`,
      [session.accountId, businessToday()],
    ),
  ]);
  const userName = users[0]?.full_name ?? "";
  const reviewPending = reviewRows[0]?.pending ?? false;

  return (
    <AppShell role={session.role} userName={userName} reviewPending={reviewPending}>
      {children}
    </AppShell>
  );
}
