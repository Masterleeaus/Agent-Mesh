import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockSession = {
  userId: "00000000-0000-0000-0000-000000000001",
  accountId: "00000000-0000-0000-0000-000000000002",
  role: "owner" as "owner" | "admin" | "tech",
  traceId: "00000000-0000-0000-0000-000000000099",
};

vi.mock("@/lib/auth/middleware", () => ({
  withRole: (roles: string[], handler: Function) => async (request: NextRequest) => {
    if (!roles.includes(mockSession.role)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Forbidden", traceId: mockSession.traceId } },
        { status: 403 }
      );
    }
    return handler(request, mockSession);
  },
}));

const mockClientQuery = vi.fn();
vi.mock("@/lib/db/portable", () => ({
  withPortableTransaction: async (fn: Function) => fn({ query: (...args: unknown[]) => mockClientQuery(...args) }),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { PATCH } from "../route";

const JOB_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const BASE = `http://localhost:3000/api/v1/jobs/${JOB_ID}/sub-status`;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(BASE, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockSession.role = "owner";
});

describe("PATCH /api/v1/jobs/[id]/sub-status", () => {
  it("updates a job sub-status portably", async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ id: JOB_ID }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: JOB_ID, sub_status: "waiting_parts" }] });

    const res = await PATCH(makeRequest({ sub_status: "waiting_parts" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: JOB_ID, sub_status: "waiting_parts" });
    const [sql, params] = mockClientQuery.mock.calls[1];
    expect(String(sql)).toContain("UPDATE jobs");
    expect(params).toEqual(["waiting_parts", JOB_ID, mockSession.accountId]);
  });

  it("returns 404 when the scoped job does not exist", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });
    const res = await PATCH(makeRequest({ sub_status: "waiting_parts" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid sub-status", async () => {
    const res = await PATCH(makeRequest({ sub_status: "weather_hold" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(mockClientQuery).not.toHaveBeenCalled();
  });

  it("returns 403 for tech role", async () => {
    mockSession.role = "tech";
    const res = await PATCH(makeRequest({ sub_status: "waiting_parts" }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
    expect(mockClientQuery).not.toHaveBeenCalled();
  });
});
