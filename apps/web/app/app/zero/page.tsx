import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/ui";
import { ZeroChatFirst } from "../ZeroChatFirst";
import { bindNativeSurface } from "@/lib/navigation/native-service-bindings";

export const dynamic = "force-dynamic";

export default async function ZeroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");
  bindNativeSurface("zero", session.accountId);

  // Counts intentionally remain conservative until canonical company-scoped
  // runtime projections are exposed. Zero must never fabricate operational state.
  return (
    <PageContainer>
      <ZeroChatFirst companyId={session.accountId} pulse={{ attention: 0, jobs: 0, onTrack: 0, exceptions: 0, activeWorkers: 0, waitingWorkers: 0, approvals: 0 }} />
      <p style={{ color: "var(--fg-muted)", margin: 0 }}>
        Zero sends requests through the authenticated interaction ingress. Runtime and workforce status appear here only when supplied by authoritative projections.
      </p>
    </PageContainer>
  );
}
