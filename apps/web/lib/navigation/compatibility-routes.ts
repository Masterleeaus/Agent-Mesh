/**
 * Retained standalone-app compatibility routes.
 *
 * This is the single source of truth for old user-facing entry points that
 * remain reachable only to preserve existing bookmarks/deep links. These
 * routes never grant authority; they resolve directly to canonical pages.
 */
export const STANDALONE_COMPATIBILITY_SCHEMA = "titan.zero.compatibility-routes.v1" as const;

export interface StandaloneCompatibilityRoute {
  from: string;
  to: string;
  reason: string;
  retained: boolean;
}

export const STANDALONE_COMPATIBILITY_ROUTES = [
  {
    from: "/app/my-day",
    to: "/app/my-work",
    reason: "My Day was consolidated into the canonical My Work surface.",
    retained: true,
  },
] as const satisfies readonly StandaloneCompatibilityRoute[];

const COMPATIBILITY_ROUTE_MAP: ReadonlyMap<string, string> = new Map(
  STANDALONE_COMPATIBILITY_ROUTES.map((entry) => [entry.from, entry.to] as const),
);

export function canonicalStandalonePathname(pathname: string): string {
  return COMPATIBILITY_ROUTE_MAP.get(pathname) ?? pathname;
}

export function standaloneCompatibilityTarget(pathname: string): string | null {
  return COMPATIBILITY_ROUTE_MAP.get(pathname) ?? null;
}
