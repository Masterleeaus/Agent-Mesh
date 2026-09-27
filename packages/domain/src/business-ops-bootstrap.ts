import type { Role } from "./statuses";
import { buildBusinessOpsAuthoritySnapshot } from "./business-ops-authority";
import { BUSINESS_OPS_COMMAND_IDS, BUSINESS_OPS_COMMAND_VERSION } from "./business-ops-commands";
import { BUSINESS_OPS_NAV_VERSION, BUSINESS_OPS_ROUTES } from "./business-ops-navigation";

/**
 * Canonical shell bootstrap shared by standalone Business Ops and Titan shells.
 *
 * The bootstrap intentionally contains identity/tenant metadata and contracts,
 * not operational records. Record data remains behind the normal tenant-scoped
 * Business Ops APIs.
 */
export const BUSINESS_OPS_BOOTSTRAP_VERSION = 1 as const;

export type BusinessOpsBootstrapInput = {
  userId: string;
  accountId: string;
  accountName: string | null;
  role: Role;
};

export function buildBusinessOpsBootstrap(input: BusinessOpsBootstrapInput) {
  return {
    product: "titan-business-ops" as const,
    bootstrapVersion: BUSINESS_OPS_BOOTSTRAP_VERSION,
    standalone: true as const,
    extensionRequired: false as const,
    session: {
      authenticated: true as const,
      userId: input.userId,
      accountId: input.accountId,
      role: input.role,
    },
    account: {
      id: input.accountId,
      name: input.accountName,
    },
    navigation: {
      contractVersion: BUSINESS_OPS_NAV_VERSION,
      routes: BUSINESS_OPS_ROUTES,
    },
    authority: buildBusinessOpsAuthoritySnapshot(input.role),
    commands: {
      contractVersion: BUSINESS_OPS_COMMAND_VERSION,
      endpoint: "/api/v1/navigation/commands" as const,
      commandIds: BUSINESS_OPS_COMMAND_IDS,
      mutationAuthority: "server" as const,
    },
    launch: {
      acceptsInternalTarget: true as const,
      loginQueryParameter: "next" as const,
    },
  };
}

export type BusinessOpsBootstrap = ReturnType<typeof buildBusinessOpsBootstrap>;
