/**
 * Atomic vehicle capture + expense create (TASK-093).
 * Record tables hold facts; money lives only on expenses.
 */
import { randomUUID } from "node:crypto";
import type { DbClient } from "@/lib/db-contract";
import { getDatabaseDialect } from "@/lib/db";
import { shouldFlagSuspectOdometer } from "@ai-fsm/domain";

export async function lastKnownOdometer(
  client: DbClient,
  accountId: string,
  vehicleId: string,
): Promise<number | null> {
  const { rows } = await client.query<{ odo: number | null }>(
    `SELECT MAX(odo) AS odo FROM (
       SELECT MAX(end_odometer) AS odo FROM vehicle_sessions
         WHERE account_id = $1 AND vehicle_id = $2 AND end_odometer IS NOT NULL
       UNION ALL
       SELECT MAX(odometer) AS odo FROM vehicle_fuel_logs
         WHERE account_id = $1 AND vehicle_id = $2 AND odometer IS NOT NULL AND odometer_suspect = false
       UNION ALL
       SELECT MAX(odometer) AS odo FROM vehicle_service_records
         WHERE account_id = $1 AND vehicle_id = $2 AND odometer IS NOT NULL AND odometer_suspect = false
     ) vehicle_odometers`,
    [accountId, vehicleId],
  );
  return rows[0]?.odo ?? null;
}

export async function assertVehicleInAccount(
  client: DbClient,
  accountId: string,
  vehicleId: string,
): Promise<{ id: string; kind: string; nickname: string } | null> {
  const { rows } = await client.query<{ id: string; kind: string; nickname: string }>(
    `SELECT id, kind, nickname FROM vehicles
     WHERE id = $1 AND account_id = $2 AND is_active = true`,
    [vehicleId, accountId],
  );
  return rows[0] ?? null;
}

export async function insertVehicleExpense(
  client: DbClient,
  opts: {
    accountId: string;
    userId: string;
    vehicleId: string;
    category: "vehicle_fuel" | "vehicle_maintenance" | "vehicle_registration" | "vehicle_insurance" | "vehicle_loan_payment";
    amountCents: number;
    expenseDate: string;
    vendorName: string;
    notes?: string | null;
  },
): Promise<string> {
  const id = randomUUID();
  await client.query(
    `INSERT INTO expenses (
       id, account_id, vendor_name, category, amount_cents, expense_date,
       notes, created_by, vehicle_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, opts.accountId, opts.vendorName, opts.category, opts.amountCents, opts.expenseDate,
     opts.notes ?? null, opts.userId, opts.vehicleId],
  );
  return id;
}

export async function createFuelLogWithExpense(
  client: DbClient,
  opts: {
    accountId: string;
    userId: string;
    vehicleId: string;
    filledAt?: string;
    odometer: number | null;
    gallons: number;
    isFullTank: boolean;
    amountCents: number;
    vendorName?: string;
    notes?: string | null;
  },
): Promise<{ fuelLogId: string; expenseId: string; odometerSuspect: boolean }> {
  const vehicle = await assertVehicleInAccount(client, opts.accountId, opts.vehicleId);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  if (vehicle.kind === "trailer") throw new Error("TRAILER_NO_FUEL");

  const lastOdo = await lastKnownOdometer(client, opts.accountId, opts.vehicleId);
  const odometerSuspect = shouldFlagSuspectOdometer(opts.odometer, lastOdo);
  const filledAt = opts.filledAt ?? new Date().toISOString();
  const expenseDate = filledAt.slice(0, 10);

  const expenseId = await insertVehicleExpense(client, {
    accountId: opts.accountId,
    userId: opts.userId,
    vehicleId: opts.vehicleId,
    category: "vehicle_fuel",
    amountCents: opts.amountCents,
    expenseDate,
    vendorName: opts.vendorName?.trim() || "Fuel",
    notes: opts.notes ?? `Fuel ${opts.gallons} gal · ${vehicle.nickname}`,
  });

  const fuelLogId = randomUUID();
  await client.query(
    `INSERT INTO vehicle_fuel_logs (
       id, account_id, vehicle_id, filled_at, odometer, gallons, is_full_tank,
       odometer_suspect, notes, expense_id, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [fuelLogId, opts.accountId, opts.vehicleId, filledAt, opts.odometer, opts.gallons,
     opts.isFullTank, odometerSuspect, opts.notes ?? null, expenseId, opts.userId],
  );

  return { fuelLogId, expenseId, odometerSuspect };
}

export async function createServiceRecordWithExpense(
  client: DbClient,
  opts: {
    accountId: string;
    userId: string;
    vehicleId: string;
    servicedAt: string;
    odometer: number | null;
    serviceTypes: string[];
    amountCents: number;
    vendorName?: string | null;
    notes?: string | null;
  },
): Promise<{ serviceRecordId: string; expenseId: string; odometerSuspect: boolean }> {
  const vehicle = await assertVehicleInAccount(client, opts.accountId, opts.vehicleId);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  if (!opts.serviceTypes.length) throw new Error("SERVICE_TYPES_REQUIRED");

  const lastOdo = await lastKnownOdometer(client, opts.accountId, opts.vehicleId);
  const odometerSuspect = shouldFlagSuspectOdometer(opts.odometer, lastOdo);

  const expenseId = await insertVehicleExpense(client, {
    accountId: opts.accountId,
    userId: opts.userId,
    vehicleId: opts.vehicleId,
    category: "vehicle_maintenance",
    amountCents: opts.amountCents,
    expenseDate: opts.servicedAt.slice(0, 10),
    vendorName: opts.vendorName?.trim() || "Service",
    notes: opts.notes ?? `${opts.serviceTypes.join(", ")} · ${vehicle.nickname}`,
  });

  const serviceRecordId = randomUUID();
  const serviceTypes = getDatabaseDialect() === "mysql" ? JSON.stringify(opts.serviceTypes) : opts.serviceTypes;
  await client.query(
    `INSERT INTO vehicle_service_records (
       id, account_id, vehicle_id, serviced_at, odometer, odometer_suspect,
       service_types, vendor_name, notes, expense_id, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [serviceRecordId, opts.accountId, opts.vehicleId, opts.servicedAt.slice(0, 10), opts.odometer,
     odometerSuspect, serviceTypes, opts.vendorName ?? null, opts.notes ?? null, expenseId, opts.userId],
  );

  return { serviceRecordId, expenseId, odometerSuspect };
}

/** Map renewal_type → expenses.category (tax buckets). */
export function renewalExpenseCategory(
  renewalType: string,
): "vehicle_registration" | "vehicle_insurance" | "vehicle_maintenance" {
  switch (renewalType) {
    case "registration":
    case "inspection":
    case "emissions":
      return "vehicle_registration";
    case "insurance":
      return "vehicle_insurance";
    default:
      return "vehicle_maintenance";
  }
}

function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Complete a renewal: expense + renewal_record + advance schedule due date.
 * Requires amount_cents > 0 (every event creates an expense).
 */
export async function createRenewalRecordWithExpense(
  client: DbClient,
  opts: {
    accountId: string;
    userId: string;
    vehicleId: string;
    renewalType: string;
    renewedAt: string; // YYYY-MM-DD
    amountCents: number;
    vendorName?: string | null;
    notes?: string | null;
    /** Explicit next due; if omitted, advance from schedule interval_months. */
    nextDueDate?: string | null;
  },
): Promise<{
  renewalRecordId: string;
  expenseId: string;
  nextDueDate: string | null;
  renewalId: string | null;
}> {
  if (opts.amountCents <= 0) throw new Error("AMOUNT_REQUIRED");

  const vehicle = await assertVehicleInAccount(client, opts.accountId, opts.vehicleId);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

  const renewedAt = opts.renewedAt.slice(0, 10);
  const category = renewalExpenseCategory(opts.renewalType);

  const expenseId = await insertVehicleExpense(client, {
    accountId: opts.accountId,
    userId: opts.userId,
    vehicleId: opts.vehicleId,
    category,
    amountCents: opts.amountCents,
    expenseDate: renewedAt,
    vendorName: opts.vendorName?.trim() || opts.renewalType,
    notes: opts.notes ?? `${opts.renewalType} renewal · ${vehicle.nickname}`,
  });

  const renewalRecordId = randomUUID();
  await client.query(
    `INSERT INTO vehicle_renewal_records (
       id, account_id, vehicle_id, renewal_type, renewed_at, expense_id, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [renewalRecordId, opts.accountId, opts.vehicleId, opts.renewalType, renewedAt, expenseId, opts.userId],
  );

  // Advance matching active schedule (if any).
  const { rows: scheduleRows } = await client.query<{
    id: string;
    interval_months: number;
  }>(
    `SELECT id, interval_months FROM vehicle_renewals
     WHERE account_id = $1 AND vehicle_id = $2
       AND renewal_type = $3 AND is_active = true
     ORDER BY created_at DESC
     LIMIT 1`,
    [opts.accountId, opts.vehicleId, opts.renewalType],
  );

  let nextDueDate: string | null = opts.nextDueDate?.slice(0, 10) ?? null;
  let renewalId: string | null = null;

  if (scheduleRows[0]) {
    renewalId = scheduleRows[0].id;
    if (!nextDueDate) {
      nextDueDate = addMonthsIso(renewedAt, scheduleRows[0].interval_months);
    }
    await client.query(
      `UPDATE vehicle_renewals
       SET current_due_date = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND account_id = $3`,
      [nextDueDate, renewalId, opts.accountId],
    );
  } else if (nextDueDate) {
    // No schedule row — nothing to update; still return computed next if provided.
  }

  return {
    renewalRecordId,
    expenseId,
    nextDueDate,
    renewalId,
  };
}
