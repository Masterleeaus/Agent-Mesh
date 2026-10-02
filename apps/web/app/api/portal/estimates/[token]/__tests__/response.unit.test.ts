import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn(), audit: vi.fn(), owner: vi.fn(), job: vi.fn(), artifacts: vi.fn(), dialect: "postgres" }));
vi.mock("@/lib/db", () => ({
  getPool: () => ({ connect: mocks.connect }),
  getDatabaseDialect: () => mocks.dialect,
  queryOne: vi.fn(() => { throw new Error("Response must not read outside transaction"); }),
  query: vi.fn(),
}));
vi.mock("@/lib/db/audit", () => ({ appendAuditLog: mocks.audit }));
vi.mock("@/lib/estimates/create-job-db", () => ({ createJobFromEstimate: mocks.job, getAccountOwnerUserId: mocks.owner }));
vi.mock("@/lib/estimates/approve", () => ({ createApprovalArtifacts: mocks.artifacts }));
import { POST } from "../route";
const client = { query: mocks.query, release: mocks.release };
const estimate = { id: "estimate-a", account_id: "company-a", status: "sent" };
const params = { params: Promise.resolve({ token: "opaque-token-a" }) };
const request = (body: unknown = { action: "approve", name: "Customer" }) => new NextRequest("http://localhost/api/portal/estimates/opaque-token-a", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.dialect = "postgres";
  mocks.connect.mockResolvedValue(client);
  mocks.owner.mockResolvedValue("existing-owner");
  mocks.query.mockImplementation(async (sql: string) => ({ rows: sql.includes("FROM estimates") ? [{ ...estimate }] : [], rowCount: 1 }));
});
describe("public estimate response transaction", () => {
  it("locks before transition and scopes the write to the token-bound company", async () => {
    const response = await POST(request({ action: "approve", name: "Customer", signature_svg: "private-signature", company_id: "attacker-company" }), params);
    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mocks.query).toHaveBeenNthCalledWith(2, expect.stringContaining("share_token = $1 FOR UPDATE"), ["opaque-token-a"]);
    const update = mocks.query.mock.calls.find(([sql]) => sql.includes("UPDATE estimates"))!;
    expect(update[0]).toContain("account_id = $5 AND share_token = $6 AND status = 'sent'");
    expect(update[1]).toEqual(["approved", "Customer", "private-signature", "estimate-a", "company-a", "opaque-token-a"]);
    expect(mocks.audit).toHaveBeenCalledWith(client, {
      account_id: "company-a",
      entity_type: "estimate",
      entity_id: "estimate-a",
      action: "update",
      actor_id: null,
      old_value: { status: "sent" },
      new_value: { status: "approved", via: "portal" },
    });
    expect(JSON.stringify(mocks.audit.mock.calls[0])).not.toContain("opaque-token-a");
    expect(JSON.stringify(mocks.audit.mock.calls[0])).not.toContain("private-signature");
    expect(mocks.artifacts).toHaveBeenCalledWith(client, { estimateId: "estimate-a", accountId: "company-a", userId: "existing-owner" });
    expect(mocks.audit.mock.invocationCallOrder[0]).toBeLessThan(mocks.artifacts.mock.invocationCallOrder[0]);
    expect(mocks.query).toHaveBeenLastCalledWith("COMMIT");
    expect(mocks.audit.mock.invocationCallOrder[0]).toBeLessThan(mocks.query.mock.invocationCallOrder.at(-1)!);
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it.fails("establishes trusted company RLS context before the token row lookup", async () => {
    await POST(request(), params);
    const calls = mocks.query.mock.calls as unknown as Array<[string, unknown[]?]>;
    const lookupIndex = calls.findIndex(([sql]) =>
      sql.includes("SELECT id, status, account_id FROM estimates WHERE share_token = $1 FOR UPDATE"),
    );
    const contextIndex = calls.findIndex(([sql]) =>
      sql.includes("set_config('app.current_account_id'"),
    );

    expect(lookupIndex).toBeGreaterThanOrEqual(0);
    expect(contextIndex).toBeGreaterThanOrEqual(0);
    expect(contextIndex).toBeLessThan(lookupIndex);
  });

  it.each(["draft", "approved", "declined", "expired"])("rejects %s without another transition, audit or artifacts", async (status) => {
    mocks.query.mockResolvedValue({ rows: [{ ...estimate, status }], rowCount: 1 });
    expect((await POST(request(), params)).status).toBe(422);
    expect(mocks.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE estimates"))).toBe(false);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.job).not.toHaveBeenCalled();
    expect(mocks.artifacts).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("returns not found for an unknown token without side effects", async () => {
    mocks.query.mockResolvedValue({ rows: [], rowCount: 0 });
    expect((await POST(request(), params)).status).toBe(404);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.job).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
  });

  it("requires a successful conditional write before audit and artifacts", async () => {
    mocks.query.mockImplementation(async (sql: string) => ({ rows: sql.includes("FROM estimates") ? [{ ...estimate }] : [], rowCount: 0 }));
    await expect(POST(request(), params)).rejects.toThrow("exactly one row");
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.artifacts).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
  });

  it("rolls the estimate transition back when required audit evidence cannot be written", async () => {
    mocks.audit.mockRejectedValue(new Error("audit unavailable"));
    await expect(POST(request(), params)).rejects.toThrow("audit unavailable");
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes("UPDATE estimates"))).toBe(true);
    expect(mocks.job).not.toHaveBeenCalled();
    expect(mocks.artifacts).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenLastCalledWith("ROLLBACK");
  });

  it("records a decline without creating approval artifacts", async () => {
    expect((await POST(request({ action: "decline" }), params)).status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledWith(client, expect.objectContaining({
      actor_id: null,
      old_value: { status: "sent" },
      new_value: { status: "declined", via: "portal" },
    }));
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(mocks.artifacts).not.toHaveBeenCalled();
  });

  it("does not emit PostgreSQL RLS SQL for another dialect (does not certify its storage driver)", async () => {
    mocks.dialect = "mysql";
    expect((await POST(request(), params)).status).toBe(200);
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes("set_config"))).toBe(false);
  });

  it("rejects invalid approval before opening storage", async () => {
    expect((await POST(request({ action: "approve" }), params)).status).toBe(422);
    expect(mocks.connect).not.toHaveBeenCalled();
  });
});
