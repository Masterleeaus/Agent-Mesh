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

  // Counts intentionally remain conservative until Agents 2/3 expose their
  // canonical company-scoped runtime projection to the web application.
  // Zero must never fabricate workforce or execution state.
  return (
    <PageContainer>
      <ZeroChatFirst pulse={{ attention: 0, jobs: 0, onTrack: 0, exceptions: 0, activeWorkers: 0, waitingWorkers: 0, approvals: 0 }} />
      <p style={{ color: "var(--fg-muted)", margin: 0 }}>
        Zero is connected to the canonical interaction path. Runtime and workforce status appear here only when supplied by their authoritative projections.
      </p>
    </PageContainer>
  );
}
