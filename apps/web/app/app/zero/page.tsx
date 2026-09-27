import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/ui";
import { ZeroChatFirst } from "../ZeroChatFirst";
import { bindNativeSurface } from "@/lib/navigation/native-service-bindings";
import { queryForSession } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ZeroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");
  bindNativeSurface("zero", session.accountId);
  // The web business store still uses account_id. Normalize at this boundary;
  // the Zero presentation receives only the canonical company-scoped result.
  const [attention, visits] = await Promise.all([
    queryForSession<{ count: string }>(session,
      `SELECT COUNT(*)::text AS count FROM attention_events
       WHERE account_id = $1 AND read_at IS NULL`, [session.accountId]),
    queryForSession<{ count: string }>(session,
      `SELECT COUNT(*)::text AS count FROM visits
       WHERE account_id = $1 AND scheduled_start::date = CURRENT_DATE
         AND status <> 'cancelled'`, [session.accountId]),
  ]);
  return (
    <PageContainer>
      <ZeroChatFirst pulse={{ attention: Number(attention[0]?.count ?? 0), jobs: Number(visits[0]?.count ?? 0) }} />
      <p style={{ color: "var(--fg-muted)", margin: 0 }}>
        Workforce, approvals and execution status will appear when their authoritative projections are connected.
      </p>
    </PageContainer>
  );
}
