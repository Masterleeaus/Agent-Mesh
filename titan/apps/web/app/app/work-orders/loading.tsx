import { PageContainer, SurfaceState } from "@/components/ui";

export default function Loading() {
  return (
    <PageContainer>
      <SurfaceState kind="loading" title="Loading Work Orders…" description="Preparing the latest company-scoped view." />
    </PageContainer>
  );
}
