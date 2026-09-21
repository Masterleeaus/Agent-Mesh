import { randomUUID } from "node:crypto";
import type { DbClient } from "@/lib/db-contract";

export type CurrentVehicleAssignment = {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  plate: string | null;
  assignedAt: string;
};

export async function assignTechnicianVehicle(
  client: DbClient,
  input: { accountId: string; userId: string; vehicleId: string | null; assignedBy: string; note?: string | null },
): Promise<CurrentVehicleAssignment | null> {
  const member = await client.query<{ id: string }>(
    `SELECT id FROM business_memberships
      WHERE account_id = $1 AND user_id = $2 AND status = 'active'
      FOR UPDATE`,
    [input.accountId, input.userId],
  );
  if (!member.rows[0]) throw new Error("MEMBER_NOT_FOUND");

  await client.query(
    `UPDATE technician_vehicle_assignments
        SET unassigned_at = CURRENT_TIMESTAMP
      WHERE account_id = $1 AND user_id = $2 AND unassigned_at IS NULL`,
    [input.accountId, input.userId],
  );

  if (!input.vehicleId) return null;

  const vehicle = await client.query<{ id: string; nickname: string; plate: string | null; kind: string }>(
    `SELECT id, nickname, plate, kind FROM vehicles
      WHERE account_id = $1 AND id = $2 AND is_active = true`,
    [input.accountId, input.vehicleId],
  );
  const row = vehicle.rows[0];
  if (!row) throw new Error("VEHICLE_NOT_FOUND");
  if (row.kind === "trailer") throw new Error("TRAILER_NOT_PRIMARY_VEHICLE");

  const id = randomUUID();
  await client.query(
    `INSERT INTO technician_vehicle_assignments
       (id, account_id, user_id, vehicle_id, assigned_by, note, assigned_at, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    [id, input.accountId, input.userId, input.vehicleId, input.assignedBy, input.note ?? null],
  );
  const result = await client.query<{
    id: string; user_id: string; vehicle_id: string; nickname: string; plate: string | null; assigned_at: string;
  }>(
    `SELECT a.id, a.user_id, a.vehicle_id, v.nickname, v.plate, a.assigned_at
       FROM technician_vehicle_assignments a
       JOIN vehicles v ON v.id = a.vehicle_id AND v.account_id = a.account_id
      WHERE a.id = $1 AND a.account_id = $2`,
    [id, input.accountId],
  );
  const current = result.rows[0];
  return current ? {
    id: current.id, userId: current.user_id, vehicleId: current.vehicle_id,
    vehicleName: current.nickname, plate: current.plate, assignedAt: String(current.assigned_at),
  } : null;
}

export async function loadCurrentVehicleAssignments(client: DbClient, accountId: string) {
  const { rows } = await client.query<{
    id: string; user_id: string; vehicle_id: string; nickname: string; plate: string | null; assigned_at: string;
  }>(
    `SELECT a.id, a.user_id, a.vehicle_id, v.nickname, v.plate, a.assigned_at
       FROM technician_vehicle_assignments a
       JOIN vehicles v ON v.id = a.vehicle_id AND v.account_id = a.account_id
      WHERE a.account_id = $1 AND a.unassigned_at IS NULL
      ORDER BY a.assigned_at DESC`,
    [accountId],
  );
  return rows.map((row) => ({
    id: row.id, userId: row.user_id, vehicleId: row.vehicle_id, vehicleName: row.nickname,
    plate: row.plate, assignedAt: String(row.assigned_at),
  } satisfies CurrentVehicleAssignment));
}
