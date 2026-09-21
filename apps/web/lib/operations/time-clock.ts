import { randomUUID } from "crypto";
import type { DbClient } from "@/lib/db-contract";
import type { PayType } from "@ai-fsm/domain";
import { businessToday, openBusinessDay } from "./business-day";

export interface TimeClockRow {
  id: string;
  user_id: string;
  business_day_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  status: "open" | "closed";
  pay_type: PayType;
  hourly_rate_snapshot_cents: number | null;
  notes: string | null;
}

const COLS = `id, user_id, business_day_id, clock_in_at, clock_out_at, status, pay_type,
  hourly_rate_snapshot_cents, notes`;

export async function getOpenClock(client: DbClient, accountId: string, userId: string): Promise<TimeClockRow | null> {
  const { rows } = await client.query<TimeClockRow>(
    `SELECT ${COLS} FROM time_clock_sessions
      WHERE account_id = $1 AND user_id = $2 AND status = 'open' AND voided_at IS NULL
      FOR UPDATE`,
    [accountId, userId],
  );
  return rows[0] ?? null;
}

export interface ClockInOpts {
  payType?: PayType;
  hourlyRateSnapshotCents?: number | null;
  notes?: string | null;
}

export async function clockIn(client: DbClient, accountId: string, userId: string, opts: ClockInOpts = {}): Promise<{ clock: TimeClockRow; alreadyOpen: boolean }> {
  // Lock the shared user row first. Unlike a PostgreSQL partial-index upsert, this
  // serializes double-taps/retries portably on both PostgreSQL and MySQL/MariaDB.
  await client.query(`SELECT id FROM users WHERE id = $1 AND account_id = $2 FOR UPDATE`, [userId, accountId]);
  const existing = await getOpenClock(client, accountId, userId);
  if (existing) return { clock: existing, alreadyOpen: true };

  const day = await openBusinessDay(client, accountId, userId, businessToday(), userId);
  const id = randomUUID();
  await client.query(
    `INSERT INTO time_clock_sessions
       (id, account_id, user_id, business_day_id, status, pay_type, hourly_rate_snapshot_cents, notes, created_by)
     VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8)`,
    [id, accountId, userId, day.id, opts.payType ?? "hourly", opts.hourlyRateSnapshotCents ?? null, opts.notes ?? null, userId],
  );
  const { rows } = await client.query<TimeClockRow>(`SELECT ${COLS} FROM time_clock_sessions WHERE id = $1 AND account_id = $2`, [id, accountId]);
  if (!rows[0]) throw new Error("clockIn: inserted clock could not be reloaded");
  return { clock: rows[0], alreadyOpen: false };
}

export async function listTodayClocks(client: DbClient, accountId: string, userId: string): Promise<TimeClockRow[]> {
  const today = businessToday();
  const { rows } = await client.query<TimeClockRow>(
    `SELECT ${COLS} FROM time_clock_sessions
      WHERE account_id = $1 AND user_id = $2 AND voided_at IS NULL
        AND (status = 'open' OR DATE(clock_in_at) = $3)
      ORDER BY clock_in_at DESC`,
    [accountId, userId, today],
  );
  return rows;
}

export async function voidClock(client: DbClient, accountId: string, sessionId: string, reason: string): Promise<TimeClockRow | null> {
  const { rows: existing } = await client.query<TimeClockRow>(
    `SELECT ${COLS} FROM time_clock_sessions WHERE id = $1 AND account_id = $2 AND voided_at IS NULL FOR UPDATE`,
    [sessionId, accountId],
  );
  if (!existing[0]) return null;
  await client.query(
    `UPDATE time_clock_sessions SET voided_at = CURRENT_TIMESTAMP, correction_reason = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND account_id = $3 AND voided_at IS NULL`,
    [reason, sessionId, accountId],
  );
  return existing[0];
}

export async function correctClock(
  client: DbClient,
  accountId: string,
  sessionId: string,
  actorId: string,
  input: { clockInAt: string; clockOutAt: string | null; reason: string },
): Promise<TimeClockRow | null> {
  const { rows: sourceRows } = await client.query<TimeClockRow>(
    `SELECT ${COLS} FROM time_clock_sessions WHERE id = $1 AND account_id = $2 AND voided_at IS NULL FOR UPDATE`,
    [sessionId, accountId],
  );
  const source = sourceRows[0];
  if (!source) return null;
  await client.query(
    `UPDATE time_clock_sessions SET voided_at = CURRENT_TIMESTAMP, correction_reason = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND account_id = $3 AND voided_at IS NULL`,
    [input.reason, sessionId, accountId],
  );
  const id = randomUUID();
  await client.query(
    `INSERT INTO time_clock_sessions
       (id, account_id, user_id, business_day_id, clock_in_at, clock_out_at, status,
        pay_type, hourly_rate_snapshot_cents, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, accountId, source.user_id, source.business_day_id, input.clockInAt, input.clockOutAt,
      input.clockOutAt ? "closed" : "open", source.pay_type, source.hourly_rate_snapshot_cents, source.notes, actorId],
  );
  const { rows } = await client.query<TimeClockRow>(`SELECT ${COLS} FROM time_clock_sessions WHERE id = $1 AND account_id = $2`, [id, accountId]);
  return rows[0] ?? null;
}

export async function clockOut(client: DbClient, accountId: string, userId: string): Promise<TimeClockRow | null> {
  const open = await getOpenClock(client, accountId, userId);
  if (!open) return null;
  await client.query(
    `UPDATE time_clock_sessions SET status = 'closed', clock_out_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND account_id = $2 AND status = 'open'`,
    [open.id, accountId],
  );
  const { rows } = await client.query<TimeClockRow>(`SELECT ${COLS} FROM time_clock_sessions WHERE id = $1 AND account_id = $2`, [open.id, accountId]);
  return rows[0] ?? null;
}
