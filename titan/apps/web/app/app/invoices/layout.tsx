import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { PageContainer, SurfaceState } from "@/components/ui";

// EPIC-006: technicians have no access to this business area. Guarding at the
// layout covers the index page AND every nested route ([id], new, etc.), so a
// tech who is linked to a specific id is still redirected to My Day.
export default async function InvoicesLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") {
    return (
      <PageContainer>
        <SurfaceState
          kind="permission"
          title="Invoices is not available in your role"
          description="This business area is restricted to office roles. Your field workspace is still available."
          action={<Link href="/app/my-work">Return to My Day</Link>}
        />
      </PageContainer>
    );
  }
  return <>{children}</>;
}
