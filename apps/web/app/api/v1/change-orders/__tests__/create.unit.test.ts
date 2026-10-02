import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), audit: vi.fn() }));
const company = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const estimate = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
vi.mock("@/lib/auth/middleware", () => ({
  withRole: (_roles: string[], handler: Function) => (request: NextRequest) => handler(request, { accountId: company, userId: "actor", traceId: "trace" }),
  withAuth: (handler: Function) => handler,
}));
vi.mock("@/lib/db", () => ({ getPool: () => ({ connect: async () => mocks }) }));
vi.mock("@/lib/db/audit", () => ({ appendAuditLog: mocks.audit }));
import { POST } from "../route";
function request() {
  return new NextRequest("http://localhost/api/v1/change-orders", { method: "POST", body: JSON.stringify({
    estimate_id: estimate, title: "Additional work", tax_rate: 10,
    line_items: [{ description: "Part", quantity: 2, unit_price_cents: 125 }],
  }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.query.mockImplementation(async (sql: string) => ({ rows: sql.includes("FROM estimates") ? [{ id: estimate, status: "approved" }] : [], rowCount: 1 }));
});
describe("change order creation", () => {
  it("locks the company estimate on the write transaction and threads application IDs into lines and audit", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.query).toHaveBeenNthCalledWith(2, expect.stringMatching(/account_id = \$2 FOR UPDATE/), [estimate, company]);
    const parent = mocks.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO change_orders"))!;
    expect(parent[0]).not.toMatch(/RETURNING/);
    expect(parent[1]).toEqual([id, estimate, company, "Additional work", null, null, 250, 25, 275, "actor"]);
    const line = mocks.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO change_order_line_items"))!;
    expect(line[1][0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(line[1].slice(1)).toEqual([id, "Part", 2, 125, 250, 0]);
    expect(mocks.audit).toHaveBeenCalledWith(mocks, expect.objectContaining({ account_id: company, entity_id: id, actor_id: "actor" }));
    expect(mocks.query).toHaveBeenLastCalledWith("COMMIT");
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it("does not insert or audit when the company-scoped estimate lookup is empty", async () => {
    mocks.query.mockResolvedValue({ rows: [], rowCount: 0 });
    expect((await POST(request())).status).toBe(404);
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes("INSERT"))).toBe(false);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
  });
  it("rolls back if child persistence fails", async () => {
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes("INSERT INTO change_order_line_items")) throw new Error("storage unavailable");
      return { rows: sql.includes("FROM estimates") ? [{ id: estimate, status: "approved" }] : [] };
    });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledOnce();
  });
});
