import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = {
  userId: "00000000-0000-0000-0000-000000000001",
  accountId: "00000000-0000-0000-0000-000000000002",
  role: "owner" as const,
  traceId: "00000000-0000-0000-0000-000000000099",
};

vi.mock("../../../../../lib/auth/middleware", () => ({
  withAuth: (handler: Function) => (req: NextRequest) => handler(req, mockSession),
  withRole: (_roles: string[], handler: Function) => (req: NextRequest) => handler(req, mockSession),
}));

const mockPortableQuery = vi.fn();
const mockPortableQueryOne = vi.fn();
const mockClientQuery = vi.fn();
const mockClient = { query: (...args: unknown[]) => mockClientQuery(...args) };

vi.mock("../../../../../lib/db/portable", () => ({
  portableQuery: (...args: unknown[]) => mockPortableQuery(...args),
  portableQueryOne: (...args: unknown[]) => mockPortableQueryOne(...args),
  withPortableTransaction: async (fn: Function) => fn(mockClient),
}));

vi.mock("../../../../../lib/db/audit", () => ({
  appendAuditLog: vi.fn(),
}));

vi.mock("../../../../../lib/logger", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("../../../../../lib/invoices/final-invoice", () => ({
  createDraftFinalInvoiceForJob: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../../../../lib/booking-requests/fulfill", () => ({
  markLinkedBookingRequestConverted: vi.fn().mockResolvedValue(undefined),
}));

import { GET as jobList, POST as jobCreate } from "../route";
import { GET as jobGet, PATCH as jobPatch, DELETE as jobDelete } from "../[id]/route";
import { POST as jobTransition } from "../[id]/transition/route";

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

const BASE = "http://localhost:3000/api/v1/jobs";
const JOB_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLIENT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const SAMPLE_JOB = {
  id: JOB_ID,
  account_id: mockSession.accountId,
  client_id: CLIENT_ID,
  title: "Fix roof",
  status: "draft",
  priority: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockClientQuery.mockResolvedValue({ rows: [] });
});

describe("GET /api/v1/jobs", () => {
  it("returns 200 with job array", async () => {
    mockPortableQuery.mockResolvedValue([SAMPLE_JOB]);
    const res = await jobList(makeRequest("GET", BASE));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe(JOB_ID);
  });

  it("returns 200 with empty array when no jobs", async () => {
    mockPortableQuery.mockResolvedValue([]);
    const res = await jobList(makeRequest("GET", BASE));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ data: [] });
  });

  it("filters by client_id when a valid one is provided", async () => {
    mockPortableQuery.mockResolvedValue([SAMPLE_JOB]);
    const CID = "22222222-2222-2222-2222-222222222222";
    const res = await jobList(makeRequest("GET", `${BASE}?client_id=${CID}`));
    expect(res.status).toBe(200);
    const [sql, params] = mockPortableQuery.mock.calls[0];
    expect(String(sql)).toContain("client_id = $2");
    expect(params).toContain(CID);
  });

  it("returns 400 when client_id is not a UUID", async () => {
    const res = await jobList(makeRequest("GET", `${BASE}?client_id=not-a-uuid`));
    expect(res.status).toBe(400);
    expect(mockPortableQuery).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/jobs", () => {
  it("returns 201, persists the job, and creates its default work order", async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // INSERT job
      .mockResolvedValueOnce({ rows: [SAMPLE_JOB] }) // SELECT persisted job
      .mockResolvedValueOnce({ rows: [] }); // INSERT default work order

    const res = await jobCreate(makeRequest("POST", BASE, { client_id: CLIENT_ID, title: "Fix roof" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.title).toBe("Fix roof");

    const sqlCalls = mockClientQuery.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(sqlCalls.some((sql: string) => sql.includes("INSERT INTO jobs (id,"))).toBe(true);
    expect(sqlCalls.some((sql: string) => sql.includes("INSERT INTO work_orders (id,"))).toBe(true);
  });

  it("returns 422 when title is missing", async () => {
    const res = await jobCreate(makeRequest("POST", BASE, { client_id: CLIENT_ID }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when client_id is not a UUID", async () => {
    const res = await jobCreate(makeRequest("POST", BASE, { client_id: "not-a-uuid", title: "Fix roof" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/jobs/[id]", () => {
  it("returns 200 with job when found", async () => {
    mockPortableQueryOne.mockResolvedValue(SAMPLE_JOB);
    const res = await jobGet(makeRequest("GET", `${BASE}/${JOB_ID}`));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(JOB_ID);
  });

  it("returns 404 when job not found", async () => {
    mockPortableQueryOne.mockResolvedValue(null);
    const res = await jobGet(makeRequest("GET", `${BASE}/${JOB_ID}`));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/v1/jobs/[id]", () => {
  it("updates fields with placeholder order safe for MySQL adapter", async () => {
    const updated = { ...SAMPLE_JOB, title: "Fixed roof" };
    mockClientQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_JOB] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [updated] });

    const res = await jobPatch(makeRequest("PATCH", `${BASE}/${JOB_ID}`, { title: "Fixed roof" }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.title).toBe("Fixed roof");

    const [sql, params] = mockClientQuery.mock.calls[1];
    expect(String(sql)).toContain("title = $1");
    expect(String(sql)).toContain("id = $2 AND account_id = $3");
    expect(params).toEqual(["Fixed roof", JOB_ID, mockSession.accountId]);
  });
});

describe("DELETE /api/v1/jobs/[id]", () => {
  it("returns 204 when deleting a draft job", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [{ ...SAMPLE_JOB, status: "draft" }] });
    const res = await jobDelete(makeRequest("DELETE", `${BASE}/${JOB_ID}`));
    expect(res.status).toBe(204);
  });

  it("detaches communications_log before deleting draft job", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [{ ...SAMPLE_JOB, status: "draft" }] });
    await jobDelete(makeRequest("DELETE", `${BASE}/${JOB_ID}`));
    const sqlCalls = mockClientQuery.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(sqlCalls.findIndex((s: string) => s.includes("UPDATE communications_log"))).toBeGreaterThan(-1);
    expect(sqlCalls.findIndex((s: string) => s.includes("DELETE FROM jobs"))).toBeGreaterThan(
      sqlCalls.findIndex((s: string) => s.includes("UPDATE communications_log")),
    );
  });

  it("returns 409 when deleting a non-draft job", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [{ ...SAMPLE_JOB, status: "invoiced" }] });
    const res = await jobDelete(makeRequest("DELETE", `${BASE}/${JOB_ID}`));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("returns 404 when job not found for delete", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });
    const res = await jobDelete(makeRequest("DELETE", `${BASE}/${JOB_ID}`));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/jobs/[id]/transition", () => {
  it("returns 200 on valid transition draft → quoted", async () => {
    const updated = { ...SAMPLE_JOB, status: "quoted" };
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ ...SAMPLE_JOB, status: "draft" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [updated] });

    const res = await jobTransition(makeRequest("POST", `${BASE}/${JOB_ID}/transition`, { status: "quoted" }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("quoted");
  });

  it("uses SQL-appearance parameter order when completion fills invoice due dates", async () => {
    const active = { ...SAMPLE_JOB, status: "in_progress" };
    const completed = { ...SAMPLE_JOB, status: "completed" };
    mockClientQuery
      .mockResolvedValueOnce({ rows: [active] }) // job lock
      .mockResolvedValueOnce({ rows: [] }) // job status update
      .mockResolvedValueOnce({ rows: [completed] }) // reload job
      .mockResolvedValueOnce({ rows: [] }) // SAVEPOINT
      .mockResolvedValueOnce({ rows: [] }) // RELEASE SAVEPOINT
      .mockResolvedValueOnce({ rows: [] }) // existing invoice lookup
      .mockResolvedValueOnce({ rows: [] }); // due-date update

    const res = await jobTransition(makeRequest("POST", `${BASE}/${JOB_ID}/transition`, { status: "completed" }));
    expect(res.status).toBe(200);

    const dueCall = mockClientQuery.mock.calls.find((c: unknown[]) => String(c[0]).includes("SET due_date = $1"));
    expect(dueCall).toBeTruthy();
    expect(dueCall?.[1]?.[1]).toBe(JOB_ID);
    expect(dueCall?.[1]?.[2]).toBe(mockSession.accountId);
  });

  it("returns 422 on invalid transition invoiced → draft", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [{ ...SAMPLE_JOB, status: "invoiced" }] });
    const res = await jobTransition(makeRequest("POST", `${BASE}/${JOB_ID}/transition`, { status: "draft" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("INVALID_TRANSITION");
  });

  it("returns 422 on unknown target status", async () => {
    const res = await jobTransition(makeRequest("POST", `${BASE}/${JOB_ID}/transition`, { status: "flying" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when job not found for transition", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });
    const res = await jobTransition(makeRequest("POST", `${BASE}/${JOB_ID}/transition`, { status: "quoted" }));
    expect(res.status).toBe(404);
  });
});
