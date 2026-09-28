import type { Role } from "./statuses";

/**
 * Shared Titan Business Ops role-affordance contract.
 *
 * Despite the historical filename, this is NOT Titan's effective-authority
 * engine. It describes role-based UI/command affordances shared by the full
 * base web app and other consumers. A listed role/action is only an input to
 * authorization. Every consequential operation must still traverse canonical
 * effective authority + ExecutionGateway immediately before execution; neither
 * client state nor a legacy server route can treat this snapshot as authority.
 */
export const BUSINESS_OPS_AUTHORITY_VERSION = 1 as const;

export const BUSINESS_OPS_ACTIONS = [
  "account.manage_settings",
  "members.manage",
  "clients.manage",
  "jobs.create",
  "jobs.assign_worker",
  "jobs.transition",
  "visits.create",
  "visits.assign_worker",
  "visits.transition",
  "visits.update_notes",
  "visits.update_checklist",
  "estimates.create",
  "estimates.send",
  "estimates.convert_to_invoice",
  "invoices.create",
  "invoices.send",
  "payments.record",
  "expenses.view",
  "expenses.manage",
  "reports.view",
  "audit.view",
  "period.close",
  "period.reopen",
  "documents.link",
  "records.delete",
  "jobs.view_all",
  "visits.view_all",
] as const;

export type BusinessOpsAction = (typeof BUSINESS_OPS_ACTIONS)[number];

export const BUSINESS_OPS_ACTION_ROLES: Record<BusinessOpsAction, readonly Role[]> = {
  "account.manage_settings": ["owner"],
  "members.manage": ["owner", "admin"],
  "clients.manage": ["owner", "admin"],
  "jobs.create": ["owner", "admin", "tech"],
  "jobs.assign_worker": ["owner", "admin"],
  "jobs.transition": ["owner", "admin"],
  "visits.create": ["owner", "admin"],
  "visits.assign_worker": ["owner", "admin"],
  "visits.transition": ["owner", "admin", "tech"],
  "visits.update_notes": ["owner", "admin", "tech"],
  "visits.update_checklist": ["owner", "admin", "tech"],
  "estimates.create": ["owner", "admin"],
  "estimates.send": ["owner", "admin"],
  "estimates.convert_to_invoice": ["owner", "admin"],
  "invoices.create": ["owner", "admin"],
  "invoices.send": ["owner", "admin"],
  "payments.record": ["owner", "admin"],
  "expenses.view": ["owner", "admin", "tech"],
  "expenses.manage": ["owner", "admin"],
  "reports.view": ["owner", "admin"],
  "audit.view": ["owner", "admin"],
  "period.close": ["owner", "admin"],
  "period.reopen": ["owner"],
  "documents.link": ["owner", "admin"],
  "records.delete": ["owner"],
  "jobs.view_all": ["owner", "admin"],
  "visits.view_all": ["owner", "admin"],
};

export function canBusinessOpsAction(role: Role, action: BusinessOpsAction): boolean {
  return BUSINESS_OPS_ACTION_ROLES[action].includes(role);
}

export function businessOpsActionsForRole(role: Role): BusinessOpsAction[] {
  return BUSINESS_OPS_ACTIONS.filter((action) => canBusinessOpsAction(role, action));
}

export type BusinessOpsAuthoritySnapshot = {
  contractVersion: typeof BUSINESS_OPS_AUTHORITY_VERSION;
  role: Role;
  allowedActions: BusinessOpsAction[];
};

export function buildBusinessOpsAuthoritySnapshot(role: Role): BusinessOpsAuthoritySnapshot {
  return {
    contractVersion: BUSINESS_OPS_AUTHORITY_VERSION,
    role,
    allowedActions: businessOpsActionsForRole(role),
  };
}
