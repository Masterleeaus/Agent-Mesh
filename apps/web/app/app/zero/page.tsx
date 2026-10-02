import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/ui";
import { ZeroChatFirst } from "../ZeroChatFirst";
import { getProductionZeroRuntime } from "@/lib/zero/production-runtime";

export const dynamic = "force-dynamic";

export default async function ZeroPage({ searchParams }: { searchParams: Promise<{ work_id?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");
  const selectedId = (await searchParams).work_id;
  let views: any[] = [];
  let unavailable = false;
  try {
    const runtime = await getProductionZeroRuntime();
    const works = await runtime.workforceStore.list(session.accountId);
    views = (await Promise.all(works.filter((work: any) => work.origin?.actor_id === session.userId && work.origin?.surface === "zero").slice(0, 20).map((work: any) => runtime.project({ company_id: session.accountId, actor_id: session.userId, work_id: work.work_id })))).filter(Boolean);
  } catch { unavailable = true; }
  const selected = views.find(view => view.work.work_id === selectedId && view.work.state.startsWith("WAITING"));
  const continuationToken = selected?.run ? Buffer.from(JSON.stringify({ work_id: selected.work.work_id, run_id: selected.run.run_id })).toString("base64url") : undefined;
  return (
    <PageContainer>
      <ZeroChatFirst key={selectedId ?? "new"} conversationId={selected?.work.origin.conversation_id} continuationToken={continuationToken} />
      <p>To complete assigned work, enter: <code>complete work order &lt;id&gt;</code>. Completion requires its checklist, finished visits, evidence and scoped authority.</p>
      {unavailable && <p role="alert">The persisted runtime is unavailable. No job outcome can be confirmed.</p>}
      <section aria-label="Persisted work outcomes">
        {views.length === 0 && !unavailable && <p>No recorded Zero work for your account.</p>}
        {views.map(view => <article key={view.work.work_id} style={{ borderTop: "1px solid var(--border)", padding: "var(--space-3) 0" }}>
          <h2>{view.business?.title ?? view.work.objective}</h2>
          <p>Work: {view.work.state} · Run: {view.run?.state ?? "Not started"} · Outcome: {view.outcome}</p>
          <p>Business record: {view.business?.status ?? "No accessible work order"}</p>
          {view.run?.error && <p role="alert">{view.run.error.message}</p>}
          {view.work.state.startsWith("WAITING") && <Link href={{ pathname: "/app/zero", query: { work_id: view.work.work_id } }}>Continue this work</Link>}
          <details><summary>Evidence and verification</summary>
            <p>Work {view.work.work_id} · Run {view.run?.run_id ?? "Not started"}</p>
            {view.evidence.length === 0 ? <p>No execution evidence recorded.</p> : view.evidence.map((e: any) => <p key={e.evidence_id}>{e.state} · Evidence {e.evidence_id} · Decision {e.decision_id} · {e.verification?.method ?? e.failure?.message ?? e.provider}</p>)}
          </details>
        </article>)}
      </section>
    </PageContainer>
  );
}
