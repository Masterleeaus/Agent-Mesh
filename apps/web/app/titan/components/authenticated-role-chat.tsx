"use client";

import { useRouter } from "next/navigation";
import { RoleChat, type TitanRole } from "./role-chat";
import type { getDemoSurfaceProjection } from "../runtime/surface-contract.mjs";

type SurfaceProjection = ReturnType<typeof getDemoSurfaceProjection>;

export function AuthenticatedRoleChat({
  role,
  projection,
}: {
  role: TitanRole;
  projection: SurfaceProjection;
}) {
  const router = useRouter();
  const detailsHref = role === "go" ? "/app/my-work" : "/app";

  return (
    <RoleChat
      role={role}
      projection={projection}
      onOpenDetails={() => router.push(detailsHref)}
    />
  );
}
