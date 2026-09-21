import { BUSINESS_OPS_ROUTES } from "@ai-fsm/domain";

/**
 * Nested-hubs IA helpers (TASK-081).
 * Sidebar owns destinations; list pages use these for in-page hub chips (T1).
 */

export type HubLink = {
  href: string;
  label: string;
};

export const WORK_HUB_LINKS: HubLink[] = [
  { href: BUSINESS_OPS_ROUTES.requests, label: "Requests" },
  { href: BUSINESS_OPS_ROUTES.estimates, label: "Estimates" },
  { href: BUSINESS_OPS_ROUTES.jobs, label: "Projects" },
  { href: BUSINESS_OPS_ROUTES.workOrders, label: "Work Orders" },
  { href: BUSINESS_OPS_ROUTES.schedule, label: "Schedule" },
  { href: "/app/dispatch", label: "Dispatch" },
  { href: BUSINESS_OPS_ROUTES.visits, label: "Visits" },
];

export const PEOPLE_HUB_LINKS: HubLink[] = [
  { href: BUSINESS_OPS_ROUTES.clients, label: "Clients" },
  { href: BUSINESS_OPS_ROUTES.properties, label: "Properties" },
];

export const MONEY_HUB_LINKS: HubLink[] = [
  { href: BUSINESS_OPS_ROUTES.invoices, label: "Invoices" },
  { href: "/app/expenses", label: "Expenses" },
  { href: "/app/mileage", label: "Mileage" },
  { href: "/app/materials", label: "Materials" },
  { href: BUSINESS_OPS_ROUTES.reports, label: "Reports" },
];

/** Prefix match, same rules as AppShell isNavActive for non-root paths. */
export function isHubLinkActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Prefer the most specific hub link when paths nest (e.g. avoid matching a parent).
 * Links are checked longest-href-first.
 */
export function activeHubHref(pathname: string, links: HubLink[]): string | null {
  const ordered = [...links].sort((a, b) => b.href.length - a.href.length);
  for (const link of ordered) {
    if (isHubLinkActive(pathname, link.href)) return link.href;
  }
  return null;
}
