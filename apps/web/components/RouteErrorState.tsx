"use client";

import { Button } from "./ui/Button";
import { SurfaceState } from "./ui/SurfaceState";

export function RouteErrorState({ reset }: { reset: () => void }) {
  return (
    <SurfaceState
      kind="error"
      title="This view could not be loaded"
      description="Your data has not been changed. Retry the view, or use navigation to continue elsewhere."
      action={<Button onClick={reset}>Try again</Button>}
      testId="route-error-state"
    />
  );
}
