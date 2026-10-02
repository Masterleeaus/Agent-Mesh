import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AuthSession } from "@/lib/auth/middleware";
import type { DbClient } from "@/lib/db-contract";

const state = vi.hoisted(() => ({ query: vi.fn(), calculate: vi.fn(), insert: vi.fn(), audit: vi.fn(),
  session: { userId: "user-a", accountId: "company-a", role: "owner", traceId: "trace-a" } }));
vi.mock("@/lib/auth/middleware", () => ({ withRole: (_roles: string[], handler: (req: NextRequest, session: AuthSession) => unknown) => (req: NextRequest) => handler(req, state.session as AuthSession) }));
vi.mock("@/lib/db/portable", () => ({ portableQuery: vi.fn(), withPortableTransaction: (fn: (client: DbClient) => unknown) => fn({ dialect: "mysql", query: state.query }) }));
vi.mock("@/lib/travel/calculate", () => ({ calculateTravelForAccount: state.calculate }));
vi.mock("@/lib/travel/snapshots", () => ({ insertTravelSnapshot: state.insert }));
vi.mock("@/lib/db/audit", () => ({ appendAuditLog: state.audit }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { POST } from "../route";
function request(body = {}) { return new NextRequest("http://localhost/api/v1/work-orders/wo-a/travel", { method: "POST", body: JSON.stringify(body) }); }
beforeEach(() => { vi.resetAllMocks(); state.query.mockResolvedValue({ rows: [], rowCount: 0 }); });
describe("travel route response contract", () => {
  it("returns a tenant-scoped 404 without creating snapshots when work order is absent", async () => {
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("NOT_FOUND");
    expect(state.query).toHaveBeenCalledWith(expect.stringContaining("account_id = $2"), ["wo-a", "company-a"]);
    expect(state.calculate).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.audit).not.toHaveBeenCalled();
  });
  it("returns 422 without mutation when the work order lacks a property", async () => {
    state.query.mockResolvedValue({ rows: [{ id: "wo-a", client_id: "client-a", property_id: null, job_id: null }], rowCount: 1 });
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("returns snapshot/calculation and keeps company scope on update and audit", async () => {
    state.query.mockResolvedValueOnce({ rows: [{ id: "wo-a", client_id: "client-a", property_id: "property-a", job_id: "job-a" }], rowCount: 1 });
    state.calculate.mockResolvedValue({ calculation: { total_travel_charge_cents: 500 }, origin_address: "origin", destination_address: "destination", calculation_source: "manual", trip_calculation_method: "manual", mileage_rate_id: null });
    state.insert.mockResolvedValue({ id: "snapshot-a", total_travel_charge_cents: 500, policy_tier: "standard" });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).data.calculation.total_travel_charge_cents).toBe(500);
    expect(state.query).toHaveBeenCalledWith(expect.stringContaining("AND account_id = $3"), ["snapshot-a", "wo-a", "company-a"]);
    expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ account_id: "company-a", entity_id: "wo-a" }));
  });
});
