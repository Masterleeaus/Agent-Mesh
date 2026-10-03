import cleaningBundle from "../../../../packages/modules/bundles/cleaning-workforce.bundle.json";
import {
  createCompanyVerticalPackProfileAuthority,
  createVerticalPackFromBundle,
  type CompanyVerticalProfile,
} from "../../../../packages/titan-platform/src/vertical-pack";
import type { StorageClient, VerifiedCompanyScope } from "../../../../packages/storage/src/index";

/** App entry used inside the canonical `withNativeCompanyStore` operation.
 * Its storage argument must be the client yielded by that consumer, after it
 * has matched #302's current session and verified #1233's company placement. */
export async function ensureCleaningFirstRunProfile(input: {
  readonly scope: VerifiedCompanyScope;
  readonly storage: StorageClient;
  readonly assertCurrent?: () => Promise<void>;
}) {
  if (input.scope.kind !== "authenticated") throw new Error("vertical-pack-authenticated-session-required");
  const company_id = input.scope.current.company_id;
  const pack = createVerticalPackFromBundle(cleaningBundle, company_id, "titan.workforce.cleaning");
  const authority = createCompanyVerticalPackProfileAuthority({
    scope: input.scope,
    storage: input.storage,
    assertCurrent: input.assertCurrent,
  });
  return authority.ensureDefault(pack);
}

/** Read the persisted selection for an authenticated, placement-bound store. */
export async function readCurrentCompanyVerticalProfile(input: {
  readonly scope: VerifiedCompanyScope;
  readonly storage: StorageClient;
  readonly assertCurrent?: () => Promise<void>;
}): Promise<Readonly<{ company_id: string; revision: number; profile: CompanyVerticalProfile | null }>> {
  const authority = createCompanyVerticalPackProfileAuthority({
    scope: input.scope,
    storage: input.storage,
    assertCurrent: input.assertCurrent,
  });
  return authority.read();
}
