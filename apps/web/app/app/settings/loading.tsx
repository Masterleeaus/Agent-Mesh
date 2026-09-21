import { PageContainer, SurfaceState } from "@/components/ui";

export default function Loading() {
  return (
    <PageContainer>
      <SurfaceState kind="loading" title="Loading Settings…" description="Preparing the latest company-scoped view." />
    </PageContainer>
  );
}
