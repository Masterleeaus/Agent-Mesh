import type { PoolClient } from "pg";

/**
 * Temporary compatibility adapter while the web schema still authenticates by
 * account_id. company_id remains the canonical boundary for Titan contracts.
 *
 * This deliberately derives the canonical value server-side instead of trusting
 * a request payload. Once the web identity schema carries company_id directly,
 * replace this adapter at the auth/session boundary.
 */
export async function resolveCanonicalCompanyId(
  client: PoolClient,
  accountId: string,
): Promise<string> {
  const account_id=String(accountId??"").trim();
  if(!account_id) throw new Error("account_id compatibility input is required");
  const {rows}=await client.query<{company_id:string|null}>(
    `SELECT company_id FROM accounts WHERE id=$1 LIMIT 1`,
    [account_id],
  );
  const company_id=String(rows[0]?.company_id??"").trim();
  if(!company_id) throw new Error("CANONICAL_COMPANY_BOUNDARY_UNAVAILABLE");
  return company_id;
}
