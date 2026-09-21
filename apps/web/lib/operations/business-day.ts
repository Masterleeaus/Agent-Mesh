import { randomUUID } from "crypto";
import type { DbClient } from "@/lib/db-contract";
import type { BusinessDayStatus } from "@titan-zero/domain";

/**
 * The business operates in one local timezone (a single NH business). "Today" is
 * computed in that zone so an evening request never opens tomorrow's row the way
 * a UTC date would. Override with BUSINESS_TZ.
 */
export const BUSINESS_TIMEZONE = process.env.BUSINESS_TZ || "America/New_York";

/** Today's date (YYYY-MM-DD) in the business timezone. */
export function businessToday(tz: string = BUSINESS_TIMEZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

/**
 * Current wall-clock minutes-since-midnight in the business timezone.
 * Use for time-of-day gates (e.g. a review cutoff) so they don't compare the
 * server's UTC hour against a business-local cutoff.
 */
export function businessMinutesNow(tz: string = BUSINESS_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

/**
 * Business Day persistence helpers (TASK-051, Operations Engine Phase 1).
 *
 * The Business Day is a pure aggregate (see docs/canonical/OPERATIONS.md): these
 * helpers only create the container and move its own lifecycle status. They never
 * touch the records the day summarizes — closing a trip/activity/job is not a day
 * transition. The lifecycle rules live in `@titan-zero/domain` (business-day.ts);
 * callers validate with `checkBusinessDayTransition` before calling
 * `setBusinessDayStatus`.
 *
 * All helpers expect a transaction `client` with the app.* RLS session vars set
 * (business_days uses FORCE ROW LEVEL SECURITY) — i.e. run inside `withDbSession`.
 */

export interface BusinessDayRow {
  id: string;
  user_id: string;
  business_date: string;
  status: BusinessDayStatus;
  opened_at: string;
  closed_at: string | null;
  reopened_reason: string | null;
  notes: string | null;
}

const COLS = `id, user_id, business_date, status, opened_at, closed_at, reopened_reason, notes`;

export async function getBusinessDay(
  client: DbClient,
  accountId: string,
  userId: string,
  date: string,
): Promise<BusinessDayRow | null> {
  const { rows } = await client.query<BusinessDayRow>(
    `SELECT ${COLS} FROM business_days
      WHERE account_id = $1 AND user_id = $2 AND business_date = $3`,
    [accountId, userId, date],
  );
  return rows[0] ?? null;
}

export async function getBusinessDayById(
  client: DbClient,
  accountId: string,
  id: string,
  opts: { lockForUpdate?: boolean } = {},
): Promise<BusinessDayRow | null> {
  // FOR UPDATE serializes concurrent transitions: the second request blocks
  // until the first commits, then re-reads the new status and re-validates.
  const { rows } = await client.query<BusinessDayRow>(
    `SELECT ${COLS} FROM business_days
      WHERE id = $1 AND account_id = $2${opts.lockForUpdate ? " FOR UPDATE" : ""}`,
    [id, accountId],
  );
  return rows[0] ?? null;
}

/** Open today's business day if it isn't already (idempotent — one row per user/date). */
export async function openBusinessDay(
  client: DbClient,
  accountId: string,
  userId: string,
  date: string,
  createdBy: string,
): Promise<BusinessDayRow> {
  await client.query(`SELECT id FROM users WHERE id = $1 AND account_id = $2 FOR UPDATE`, [userId, accountId]);
  let row = await getBusinessDay(client, accountId, userId, date);
  if (!row) {
    const id = randomUUID();
    await client.query(
      `INSERT INTO business_days (id, account_id, user_id, business_date, status, created_by)
       VALUES ($1, $2, $3, $4, 'OPEN', $5)`,
      [id, accountId, userId, date, createdBy],
    );
    row = await getBusinessDay(client, accountId, userId, date);
  }
  if (!row) throw new Error("openBusinessDay: row missing after upsert");
  return row;
}

/**
 * Apply a validated status transition. closed_at is set only when CLOSED and
 * cleared otherwise (honoring the closed_at⇔CLOSED CHECK); reopened_reason is
 * recorded only on REOPENED. Validate with `checkBusinessDayTransition` first.
 *
 * The UPDATE is guarded on the expected `from` status, so a concurrent request
 * that already moved the day cannot last-writer-win an invalid transition — a
 * null return means the day was raced (or RLS blocked the write).
 */
export async function setBusinessDayStatus(
  client: DbClient,
  accountId: string,
  id: string,
  from: BusinessDayStatus,
  to: BusinessDayStatus,
  reason: string | null,
): Promise<BusinessDayRow | null> {
  const result = await client.query(
    `UPDATE business_days
        SET status = $1,
            closed_at = CASE WHEN $2 = 'CLOSED' THEN CURRENT_TIMESTAMP ELSE NULL END,
            reopened_reason = CASE WHEN $3 = 'REOPENED' THEN $4 ELSE reopened_reason END,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND account_id = $6 AND status = $7`,
    [to, to, to, reason, id, accountId, from],
  );
  if ((result.rowCount ?? 0) === 0) return null;
  return getBusinessDayById(client, accountId, id);
}
