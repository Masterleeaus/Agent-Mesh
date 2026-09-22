import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAuthenticatedSurfaceProjection } from "@/app/titan/runtime/authenticated-surface";
import { AuthenticatedRoleChat } from "@/app/titan/components/authenticated-role-chat";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { manifest: "/go-manifest.webmanifest" };

export default async function GoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "tech") redirect("/app/command");

  const projection = createAuthenticatedSurfaceProjection(session, { surface: "go" });

  return <AuthenticatedRoleChat role="go" projection={projection} />;
}
