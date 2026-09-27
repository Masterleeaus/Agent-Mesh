import { PageContainer, SurfaceState } from "@/components/ui";

export default function AppLoading() {
  return (
    <PageContainer>
      <SurfaceState
        kind="loading"
        title="Loading workspace…"
        description="Fetching the latest company-scoped view."
        testId="app-loading-state"
      />
    </PageContainer>
  );
}
