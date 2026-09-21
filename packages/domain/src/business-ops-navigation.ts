/**
 * Shared Titan Business Ops navigation contract.
 *
 * This file is deliberately framework-free so the standalone web app, Titan
 * Zero browser extension, Titan Go, or another shell can build the same safe
 * Business Ops destinations without depending on Next.js.
 */

export const BUSINESS_OPS_NAV_VERSION = 1 as const;

export const BUSINESS_OPS_ROUTES = {
  overview: "/app",
  myDay: "/app/my-work",
  capture: "/app/capture",
  dayReview: "/app/day-review",
  requests: "/app/requests",
  clients: "/app/clients",
  properties: "/app/properties",
  estimates: "/app/estimates",
  jobs: "/app/jobs",
  workOrders: "/app/work-orders",
  schedule: "/app/schedule",
  visits: "/app/visits",
  invoices: "/app/invoices",
  reports: "/app/reports",
  settings: "/app/settings",
} as const;

export type BusinessOpsRouteKey = keyof typeof BUSINESS_OPS_ROUTES;

export type BusinessOpsEntityType =
  | "client"
  | "property"
  | "request"
  | "estimate"
  | "job"
  | "work_order"
  | "visit"
  | "invoice";

const ENTITY_COLLECTION_ROUTE: Record<BusinessOpsEntityType, string> = {
  client: BUSINESS_OPS_ROUTES.clients,
  property: BUSINESS_OPS_ROUTES.properties,
  request: BUSINESS_OPS_ROUTES.requests,
  estimate: BUSINESS_OPS_ROUTES.estimates,
  job: BUSINESS_OPS_ROUTES.jobs,
  work_order: BUSINESS_OPS_ROUTES.workOrders,
  visit: BUSINESS_OPS_ROUTES.visits,
  invoice: BUSINESS_OPS_ROUTES.invoices,
};

export type BusinessOpsLaunchCommand =
  | { type: "route"; route: BusinessOpsRouteKey; query?: Record<string, string | number | boolean | null | undefined> }
  | { type: "entity"; entityType: BusinessOpsEntityType; entityId: string; query?: Record<string, string | number | boolean | null | undefined> };

function appendQuery(path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function safeEntityId(value: string): string {
  const id = value.trim();
  if (!id || id.includes("/") || id.includes("?") || id.includes("#")) {
    throw new Error("Invalid Business Ops entity id");
  }
  return encodeURIComponent(id);
}

export function buildBusinessOpsHref(command: BusinessOpsLaunchCommand): string {
  if (command.type === "route") {
    return appendQuery(BUSINESS_OPS_ROUTES[command.route], command.query);
  }
  const collection = ENTITY_COLLECTION_ROUTE[command.entityType];
  return appendQuery(`${collection}/${safeEntityId(command.entityId)}`, command.query);
}

/**
 * Accept only same-origin Business Ops application targets.
 *
 * This is intentionally stricter than a generic relative-URL check so it can
 * safely be used for post-login redirects supplied by an extension/deep link.
 */
export function sanitizeBusinessOpsTarget(target: string | null | undefined): string | null {
  if (!target) return null;
  const raw = target.trim();
  if (!raw.startsWith("/app")) return null;
  if (raw.startsWith("//") || raw.includes("\\")) return null;

  try {
    const parsed = new URL(raw, "https://business-ops.invalid");
    if (parsed.origin !== "https://business-ops.invalid") return null;
    if (!(parsed.pathname === "/app" || parsed.pathname.startsWith("/app/"))) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}
