import type { DbClient } from "@/lib/db-contract";

/** Serialize owner role/removal checks within one account transaction. */
export async function lockOwnerMembershipChanges(
  client: Pick<DbClient, "query">,
  accountId: string,
): Promise<void> {
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
    [`workforce-owner-memberships:${accountId}`],
  );
}
