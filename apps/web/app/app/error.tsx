"use client";

import { PageContainer } from "@/components/ui";
import { RouteErrorState } from "@/components/RouteErrorState";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageContainer>
      <RouteErrorState reset={reset} />
    </PageContainer>
  );
}
