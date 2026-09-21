import type { ReactNode } from "react";

export type SurfaceStateKind = "loading" | "empty" | "error" | "permission" | "offline";

interface SurfaceStateProps {
  kind: SurfaceStateKind;
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}

const ICONS: Record<SurfaceStateKind, string> = {
  loading: "…",
  empty: "○",
  error: "!",
  permission: "🔒",
  offline: "↯",
};

/**
 * Shared, visual-system-neutral state surface for standalone routes.
 * It deliberately carries no authority or retry behaviour itself; callers
 * provide actions so permission and command decisions stay with native owners.
 */
export function SurfaceState({ kind, title, description, action, testId }: SurfaceStateProps) {
  return (
    <section
      className="p7-empty-state"
      data-surface-state={kind}
      data-testid={testId ?? `surface-state-${kind}`}
      role={kind === "error" || kind === "offline" ? "status" : undefined}
      aria-live={kind === "loading" || kind === "error" || kind === "offline" ? "polite" : undefined}
      aria-busy={kind === "loading" ? true : undefined}
      style={{ minHeight: 180, display: "grid", placeItems: "center", textAlign: "center" }}
    >
      <div style={{ maxWidth: 520 }}>
        <div className="p7-empty-icon" aria-hidden="true">{ICONS[kind]}</div>
        <h2 className="p7-empty-title">{title}</h2>
        {description ? <p className="p7-empty-desc">{description}</p> : null}
        {action ? <div style={{ marginTop: "var(--space-4)" }}>{action}</div> : null}
      </div>
    </section>
  );
}
