import { sanitizeBusinessOpsTarget } from "@ai-fsm/domain";
import { UI_RUNTIME_REACHABILITY_INVENTORY } from "./reachability-inventory";
import { canonicalStandalonePathname } from "./compatibility-routes";

/**
 * Canonical standalone-app navigation helpers.
 *
 * This layer sits above the shared Business Ops URL sanitizer: the shared
 * sanitizer proves a target is same-origin and under /app, while this module
 * proves that the target maps to a page that actually exists in the current
 * standalone build. It is navigation truth only; it grants no business or
 * execution authority.
 */

export const STANDALONE_NAVIGATION_SCHEMA = "titan.zero.standalone-navigation.v1" as const;

const APP_PAGE_TEMPLATES = UI_RUNTIME_REACHABILITY_INVENTORY.pageRoutes
  .map((entry) => entry.route)
  .filter((route) => route === "/app" || route.startsWith("/app/"));

function splitPath(pathname: string): string[] {
  if (pathname === "/") return [];
  return pathname.split("/").filter(Boolean);
}

function templateMatchesPath(template: string, pathname: string): boolean {
  const templateSegments = splitPath(template);
  const pathSegments = splitPath(pathname);
  if (templateSegments.length !== pathSegments.length) return false;

  return templateSegments.every((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return pathSegments[index]?.length > 0;
    }
    return segment === pathSegments[index];
  });
}

/** Return the concrete route template that owns a pathname, if any. */
export function matchStandalonePageTemplate(pathname: string): string | null {
  // Prefer exact/static routes before dynamic templates so /new, /quick, etc.
  // cannot be misclassified as entity ids.
  const exact = APP_PAGE_TEMPLATES.find((template) => template === pathname);
  if (exact) return exact;

  const dynamicTemplates = APP_PAGE_TEMPLATES
    .filter((template) => template.includes("["))
    .sort((a, b) => b.length - a.length);
  return dynamicTemplates.find((template) => templateMatchesPath(template, pathname)) ?? null;
}


export interface StandaloneNavigationResolution {
  schema: typeof STANDALONE_NAVIGATION_SCHEMA;
  requestedTarget: string;
  href: string;
  pathname: string;
  routeTemplate: string;
  aliasApplied: boolean;
}

/**
 * Resolve a user/app supplied standalone target into a known, reachable page.
 *
 * - rejects cross-origin and non-/app targets through the shared sanitizer;
 * - rejects unknown/dead /app paths instead of navigating into a 404;
 * - canonicalises retained compatibility aliases;
 * - preserves query strings exactly as URLSearchParams serialises them.
 */
export function resolveStandaloneNavigationTarget(
  target: string | null | undefined,
): StandaloneNavigationResolution | null {
  const safe = sanitizeBusinessOpsTarget(target);
  if (!safe) return null;

  const parsed = new URL(safe, "https://titan-zero.invalid");
  const canonicalPathname = canonicalStandalonePathname(parsed.pathname);
  const routeTemplate = matchStandalonePageTemplate(canonicalPathname);
  if (!routeTemplate) return null;

  return {
    schema: STANDALONE_NAVIGATION_SCHEMA,
    requestedTarget: safe,
    href: `${canonicalPathname}${parsed.search}`,
    pathname: canonicalPathname,
    routeTemplate,
    aliasApplied: canonicalPathname !== parsed.pathname,
  };
}

/** Convenience wrapper for redirect/navigation consumers. */
export function standaloneNavigationHref(
  target: string | null | undefined,
): string | null {
  return resolveStandaloneNavigationTarget(target)?.href ?? null;
}

export function getStandalonePageTemplates(): readonly string[] {
  return APP_PAGE_TEMPLATES;
}
