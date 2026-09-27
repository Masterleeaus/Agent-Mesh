import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { appendAuditLog } from "@/lib/db/audit";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createPropertyBody = z.object({
  client_id: z.string().uuid(),
  name: z.string().max(255).optional().or(z.literal("")),
  address: z.string().min(1).max(500),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const GET = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const clientId = searchParams.get("client_id") ?? "";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "100"), 1), 200);

  const params: unknown[] = [session.accountId];
  const conditions = ["p.account_id = $1"];
  let idx = 2;
  if (clientId) {
    conditions.push(`p.client_id = $${idx++}`);
    params.push(clientId);
  }
  if (q) {
    conditions.push(`(LOWER(p.address) LIKE $${idx} OR LOWER(COALESCE(p.name, '')) LIKE $${idx} OR LOWER(COALESCE(c.name, '')) LIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  params.push(limit);

  const rows = await portableQuery(
    `SELECT p.*, c.name AS client_name,
            (SELECT COUNT(DISTINCT j.id) FROM jobs j WHERE j.property_id = p.id AND j.account_id = p.account_id) AS job_count,
            (SELECT COUNT(DISTINCT v.id)
               FROM visits v
               JOIN jobs jv ON jv.id = v.job_id AND jv.account_id = v.account_id
              WHERE jv.property_id = p.id AND v.account_id = p.account_id) AS visit_count
     FROM properties p
     JOIN clients c ON c.id = p.client_id AND c.account_id = p.account_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY c.name ASC, p.address ASC
     LIMIT $${idx}`,
    params,
  );

  return NextResponse.json({ data: rows, limit });
});

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const body = await request.json().catch(() => null);
  const parsed = createPropertyBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } },
      { status: 422 },
    );
  }

  const id = randomUUID();
  try {
    const created = await withPortableTransaction(async (client) => {
      const { client_id, name, address, city, state, zip, notes } = parsed.data;
      const ownerClient = await client.query(`SELECT id FROM clients WHERE id = $1 AND account_id = $2`, [client_id, session.accountId]);
      if (ownerClient.rows.length === 0) {
        const error = new Error("CLIENT_NOT_FOUND");
        (error as Error & { code?: string }).code = "CLIENT_NOT_FOUND";
        throw error;
      }

      await client.query(
        `INSERT INTO properties (id, account_id, client_id, name, address, city, state, zip, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, session.accountId, client_id, name || null, address.trim(), city || null, state || null, zip || null, notes || null],
      );
      const result = await client.query<Record<string, unknown>>(`SELECT * FROM properties WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const row = result.rows[0];
      if (!row) throw new Error("Property insert did not return persisted row");

      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "property",
        entity_id: id,
        action: "insert",
        actor_id: session.userId,
        trace_id: session.traceId,
        new_value: row,
      });
      return row;
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    if ((err as Error & { code?: string }).code === "CLIENT_NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found", traceId: session.traceId } }, { status: 404 });
    }
    logger.error("[properties POST]", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create property", traceId: session.traceId } }, { status: 500 });
  }
});
