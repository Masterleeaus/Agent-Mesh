import { portableQuery } from "@/lib/db/portable";
import type { SessionPayload } from "@/lib/auth/session";
import { businessToday } from "@/lib/operations/business-day";
import { summarizeDayMileage, type VehicleSessionRow } from "@/lib/mileage/sessions";
import type { OpenSession, VehicleOption } from "@/lib/my-work/field-day-types";
import type { ActivityEntryDto } from "@/lib/my-work/field-day-types";

export type FieldDayData = {
  todayLabel: string;
  openSession: OpenSession | null;
  vehicles: VehicleOption[];
  activityEntries: ActivityEntryDto[];
  dayMileage: ReturnType<typeof summarizeDayMileage>;
  yesterdayMiles: number;
  clockedIn: boolean;
  ownerPeek: { outstandingCents: number; draftInvoices: number } | null;
  locationSettings: { enabled: boolean; pausedUntil: string | null } | null;
};

export async function loadFieldDayData(
  session: SessionPayload,
  isOwner: boolean,
): Promise<FieldDayData> {
  const accountId = session.accountId;
  // "Today" must be the business-timezone day (matches how sessions/business_days
  // are written), not the Postgres server's UTC CURRENT_DATE — otherwise an
  // evening-ET request reads tomorrow's row and the just-started session vanishes.
  const today = businessToday();
  const todayValue = new Date(`${today}T00:00:00Z`);
  const yesterday = new Date(todayValue.getTime() - 86_400_000).toISOString().slice(0, 10);

  const [openSessionRows, fieldVehicles, fieldActivity, todaySessionRows, yesterdayMilesRows, clockRows] =
    await Promise.all([
      portableQuery<OpenSession>(`SELECT s.id, s.session_date, s.vehicle_id, v.nickname AS vehicle_nickname,
                v.plate AS vehicle_plate, s.start_odometer, s.started_at AS started_at
         FROM vehicle_sessions s LEFT JOIN vehicles v ON v.id = s.vehicle_id
         WHERE s.account_id = $1 AND s.session_date = $2
           AND s.status = 'open'
           AND s.end_odometer IS NULL AND s.miles IS NULL
         ORDER BY s.started_at DESC LIMIT 1`,
        [accountId, today],
      ),
      portableQuery<VehicleOption & { last_used_at?: string | null }>(`SELECT v.id, v.nickname, v.plate,
                (SELECT vs.end_odometer
                 FROM vehicle_sessions vs
                 WHERE vs.vehicle_id = v.id AND vs.account_id = v.account_id AND vs.end_odometer IS NOT NULL
                 ORDER BY vs.session_date DESC, vs.created_at DESC LIMIT 1) AS current_odometer,
                (SELECT vs2.started_at
                 FROM vehicle_sessions vs2
                 WHERE vs2.vehicle_id = v.id AND vs2.account_id = v.account_id
                 ORDER BY vs2.started_at DESC LIMIT 1) AS last_used_at
         FROM vehicles v
         WHERE v.account_id = $1 AND v.is_active = true
         ORDER BY v.nickname ASC`,
        [accountId],
      ),
      portableQuery<ActivityEntryDto>(`SELECT id, activity_type, category, started_at, ended_at,
                entity_type, entity_id, assignment_kind, labor_bucket, note
         FROM activity_entries
         WHERE account_id = $1 AND (session_date = $2 OR ended_at IS NULL) AND voided_at IS NULL
         ORDER BY started_at ASC`,
        [accountId, today],
      ),
      portableQuery<VehicleSessionRow>(`SELECT s.vehicle_id, v.nickname AS vehicle_nickname, v.plate AS vehicle_plate,
                s.start_odometer, s.end_odometer, s.miles AS miles
         FROM vehicle_sessions s LEFT JOIN vehicles v ON v.id = s.vehicle_id
         WHERE s.account_id = $1 AND s.session_date = $2
           AND s.status <> 'voided'
         ORDER BY s.started_at ASC`,
        [accountId, today],
      ),
      portableQuery<{ count: string | number }>(`SELECT COALESCE(SUM(miles), 0) AS count
         FROM vehicle_sessions
         WHERE account_id = $1 AND session_date = $2
           AND status <> 'voided'`,
        [accountId, yesterday],
      ),
      portableQuery<{ status: string }>(`SELECT status FROM time_clock_sessions
         WHERE account_id = $1 AND user_id = $2 AND status = 'open' AND voided_at IS NULL
         ORDER BY clock_in_at DESC LIMIT 1`,
        [accountId, session.userId],
      ),
    ]);

  let ownerPeek: FieldDayData["ownerPeek"] = null;
  let locationSettings: FieldDayData["locationSettings"] = null;

  if (isOwner) {
    const settingsRows = await portableQuery<{ enabled: boolean; paused_until: string | null }>(`SELECT location_tracking_enabled AS enabled, location_paused_until AS paused_until
       FROM accounts WHERE id = $1`,
      [accountId],
    );
    locationSettings = settingsRows[0]
      ? { enabled: settingsRows[0].enabled, pausedUntil: settingsRows[0].paused_until }
      : null;

    const [outRows, draftRows] = await Promise.all([
      portableQuery<{ cents: string | number }>(`SELECT COALESCE(SUM(total_cents - paid_cents), 0) AS cents
         FROM invoices WHERE account_id = $1 AND status IN ('sent','partial','overdue')`,
        [accountId],
      ),
      portableQuery<{ count: string | number }>(`SELECT COUNT(*) AS count FROM invoices
         WHERE account_id = $1 AND status = 'draft' AND invoice_kind IN ('final','standard')`,
        [accountId],
      ),
    ]);
    ownerPeek = {
      outstandingCents: Number(outRows[0]?.cents ?? 0),
      draftInvoices: Number(draftRows[0]?.count ?? 0),
    };
  }

  return {
    todayLabel: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    openSession: openSessionRows[0] ?? null,
    vehicles: fieldVehicles,
    activityEntries: fieldActivity,
    dayMileage: summarizeDayMileage(todaySessionRows),
    yesterdayMiles: Number(yesterdayMilesRows[0]?.count ?? 0),
    clockedIn: clockRows[0]?.status === "open",
    ownerPeek,
    locationSettings,
  };
}