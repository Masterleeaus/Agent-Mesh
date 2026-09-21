import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer, PageHeader } from "@/components/ui";
import { BuilderStudio } from "./BuilderStudio";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work");

  return (
    <PageContainer>
      <PageHeader
        title="Titan Builder"
        subtitle="Describe the workspace you want. Titan creates a governed draft you can edit, preview and approve before publishing."
      />
      <BuilderStudio />
    </PageContainer>
  );
}
