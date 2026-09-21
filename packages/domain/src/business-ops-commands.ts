import type { BusinessOpsAction } from "./business-ops-authority";
import { buildBusinessOpsHref, type BusinessOpsLaunchCommand } from "./business-ops-navigation";

/**
 * Governed command handoff contract shared by Titan shells and Business Ops.
 *
 * Command ids, required authority and destinations are server-owned. A caller
 * supplies only the command id and target identifiers; it cannot downgrade the
 * permission required to perform the requested operation.
 */
export const BUSINESS_OPS_COMMAND_VERSION = 1 as const;

export const BUSINESS_OPS_COMMAND_IDS = [
  "open.route",
  "open.entity",
  "clients.create",
  "jobs.create",
  "visits.create",
  "estimates.create",
  "invoices.create",
  "invoices.send",
  "payments.record",
] as const;

export type BusinessOpsCommandId = (typeof BUSINESS_OPS_COMMAND_IDS)[number];

export type BusinessOpsCommandRequest =
  | { commandId: "open.route"; route: BusinessOpsLaunchCommand & { type: "route" } }
  | { commandId: "open.entity"; target: BusinessOpsLaunchCommand & { type: "entity" } }
  | { commandId: "clients.create" }
  | { commandId: "jobs.create"; clientId?: string; propertyId?: string }
  | { commandId: "visits.create"; jobId?: string }
  | { commandId: "estimates.create"; clientId?: string; propertyId?: string }
  | { commandId: "invoices.create"; clientId?: string; jobId?: string }
  | { commandId: "invoices.send"; invoiceId: string }
  | { commandId: "payments.record"; invoiceId: string };

export type ResolvedBusinessOpsCommand = {
  contractVersion: typeof BUSINESS_OPS_COMMAND_VERSION;
  commandId: BusinessOpsCommandId;
  requiredAction: BusinessOpsAction | null;
  href: string;
  mode: "navigate" | "action_handoff";
};

function cleanOptionalId(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const id = value.trim();
  if (!id || id.includes("/") || id.includes("?") || id.includes("#")) {
    throw new Error("Invalid Business Ops command identifier");
  }
  return id;
}

function query(values: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

export function resolveBusinessOpsCommand(command: BusinessOpsCommandRequest): ResolvedBusinessOpsCommand {
  switch (command.commandId) {
    case "open.route":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: null,
        href: buildBusinessOpsHref(command.route),
        mode: "navigate",
      };
    case "open.entity":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: null,
        href: buildBusinessOpsHref(command.target),
        mode: "navigate",
      };
    case "clients.create":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "clients.manage",
        href: buildBusinessOpsHref({ type: "route", route: "clients", query: { mode: "create" } }),
        mode: "action_handoff",
      };
    case "jobs.create":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "jobs.create",
        href: buildBusinessOpsHref({
          type: "route",
          route: "jobs",
          query: { mode: "create", ...query({ clientId: cleanOptionalId(command.clientId), propertyId: cleanOptionalId(command.propertyId) }) },
        }),
        mode: "action_handoff",
      };
    case "visits.create":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "visits.create",
        href: buildBusinessOpsHref({
          type: "route",
          route: "schedule",
          query: { mode: "create-visit", ...query({ jobId: cleanOptionalId(command.jobId) }) },
        }),
        mode: "action_handoff",
      };
    case "estimates.create":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "estimates.create",
        href: buildBusinessOpsHref({
          type: "route",
          route: "estimates",
          query: { mode: "create", ...query({ clientId: cleanOptionalId(command.clientId), propertyId: cleanOptionalId(command.propertyId) }) },
        }),
        mode: "action_handoff",
      };
    case "invoices.create":
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "invoices.create",
        href: buildBusinessOpsHref({
          type: "route",
          route: "invoices",
          query: { mode: "create", ...query({ clientId: cleanOptionalId(command.clientId), jobId: cleanOptionalId(command.jobId) }) },
        }),
        mode: "action_handoff",
      };
    case "invoices.send": {
      const invoiceId = cleanOptionalId(command.invoiceId)!;
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "invoices.send",
        href: buildBusinessOpsHref({ type: "entity", entityType: "invoice", entityId: invoiceId, query: { action: "send" } }),
        mode: "action_handoff",
      };
    }
    case "payments.record": {
      const invoiceId = cleanOptionalId(command.invoiceId)!;
      return {
        contractVersion: BUSINESS_OPS_COMMAND_VERSION,
        commandId: command.commandId,
        requiredAction: "payments.record",
        href: buildBusinessOpsHref({ type: "entity", entityType: "invoice", entityId: invoiceId, query: { tab: "payments", mode: "record" } }),
        mode: "action_handoff",
      };
    }
  }
}
