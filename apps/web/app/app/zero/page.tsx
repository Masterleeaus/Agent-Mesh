import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/ui";
import { ZeroChatFirst } from "../ZeroChatFirst";
import { bindNativeSurface } from "@/lib/navigation/native-service-bindings";
import { loadZeroPulse } from "@/lib/zero/pulse";

export const dynamic = "force-dynamic";

export default async function ZeroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");
  bindNativeSurface("zero", session.accountId);

  const pulse = await loadZeroPulse(session.accountId);

  return (
    <PageContainer>
      <ZeroChatFirst companyId={session.accountId} pulse={pulse} />
      <p style={{ color: "var(--fg-muted)", margin: 0 }}>
        Live company-scoped state from Titan&apos;s business and workforce stores. Zero is a projection and control surface, not a second source of truth.
      </p>
    </PageContainer>
  );
}
