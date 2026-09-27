import { describe, expect, it } from "vitest";
import { assignTechnicianVehicle } from "../vehicle-assignment";
import type { DbClient, DbQueryResult } from "@/lib/db-contract";

function clientFor(opts: { member?: boolean; vehicle?: { kind: string; nickname?: string } }) {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const client: DbClient = {
    async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<DbQueryResult<T>> {
      calls.push({ sql, params });
      if (sql.includes("FROM business_memberships")) return { rows: (opts.member === false ? [] : [{ id: "m1" }]) as T[] };
      if (sql.includes("FROM vehicles") && sql.includes("is_active = true")) {
        if (!opts.vehicle) return { rows: [] };
        return { rows: [{ id: "v1", nickname: opts.vehicle.nickname ?? "Truck", plate: "ABC123", kind: opts.vehicle.kind }] as T[] };
      }
      if (sql.includes("JOIN vehicles") && sql.includes("WHERE a.id")) return { rows: [{ id: "a1", user_id: "u1", vehicle_id: "v1", nickname: "Truck", plate: "ABC123", assigned_at: "2026-09-13T00:00:00Z" }] as T[] };
      return { rows: [] };
    },
  };
  return { client, calls };
}

describe("technician vehicle assignment", () => {
  it("closes the prior assignment before inserting a new one", async () => {
    const { client, calls } = clientFor({ vehicle: { kind: "truck" } });
    const result = await assignTechnicianVehicle(client, { accountId: "acct", userId: "u1", vehicleId: "v1", assignedBy: "owner" });
    expect(result?.vehicleId).toBe("v1");
    expect(calls.some((c) => c.sql.includes("SET unassigned_at = CURRENT_TIMESTAMP"))).toBe(true);
    expect(calls.some((c) => c.sql.includes("INSERT INTO technician_vehicle_assignments"))).toBe(true);
  });

  it("unassigns without creating a replacement row", async () => {
    const { client, calls } = clientFor({});
    const result = await assignTechnicianVehicle(client, { accountId: "acct", userId: "u1", vehicleId: null, assignedBy: "owner" });
    expect(result).toBeNull();
    expect(calls.some((c) => c.sql.includes("INSERT INTO technician_vehicle_assignments"))).toBe(false);
  });

  it("rejects a trailer as the primary field vehicle", async () => {
    const { client } = clientFor({ vehicle: { kind: "trailer" } });
    await expect(assignTechnicianVehicle(client, { accountId: "acct", userId: "u1", vehicleId: "v1", assignedBy: "owner" })).rejects.toThrow("TRAILER_NOT_PRIMARY_VEHICLE");
  });
});
