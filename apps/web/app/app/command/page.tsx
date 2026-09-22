import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAuthenticatedSurfaceProjection } from "@/app/titan/runtime/authenticated-surface";
import { RoleChat } from "@/app/titan/components/role-chat";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");

  const projection = createAuthenticatedSurfaceProjection(session, { surface: "zero" });

  return (
    <RoleChat
      role="zero"
      projection={projection}
      onOpenDetails={() => undefined}
    />
  );
}
