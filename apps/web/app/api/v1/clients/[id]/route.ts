import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { normalizeClientName } from "@/lib/crm/normalization";
import { appendAuditLog } from "@/lib/db/audit";
import { portableQueryOne, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";
import { getPathId } from "@/lib/route-utils";

export const dynamic = "force-dynamic";

const patchClientBody = z.object({
  name: z.string().min(1).max(255).optional(), email: z.string().email().optional().or(z.literal("")), phone: z.string().max(50).optional().or(z.literal("")), notes: z.string().max(5000).optional().or(z.literal("")),
  company_name: z.string().max(255).optional().or(z.literal("")), address_line1: z.string().max(500).optional().or(z.literal("")), city: z.string().max(100).optional().or(z.literal("")), state: z.string().max(100).optional().or(z.literal("")), zip: z.string().max(20).optional().or(z.literal("")),
  relationship_type: z.enum(["standard", "realtor", "preferred", "referral_partner"]).optional(),
  travel_rule: z.enum(["standard_policy", "mileage_waived", "travel_time_waived", "all_travel_waived", "custom_included_radius", "custom_mileage_rate", "custom_travel_time_rate", "minimum_project_value_exemption", "manual_review_required"]).optional(),
  custom_included_one_way_miles: z.number().min(0).max(500).nullable().optional(), custom_mileage_rate_cents: z.number().int().min(0).nullable().optional(), custom_travel_time_rate_cents: z.number().int().min(0).nullable().optional(), minimum_project_value_exempt: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

export const GET = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);
  const row = await portableQueryOne(
    `SELECT c.*, COUNT(DISTINCT p.id) AS property_count, COUNT(DISTINCT j.id) AS job_count,
            COUNT(DISTINCT e.id) AS estimate_count, COUNT(DISTINCT i.id) AS invoice_count
     FROM clients c
     LEFT JOIN properties p ON p.client_id = c.id AND p.account_id = c.account_id
     LEFT JOIN jobs j ON j.client_id = c.id AND j.account_id = c.account_id
     LEFT JOIN estimates e ON e.client_id = c.id AND e.account_id = c.account_id
     LEFT JOIN invoices i ON i.client_id = c.id AND i.account_id = c.account_id
     WHERE c.id = $1 AND c.account_id = $2 GROUP BY c.id`, [id, session.accountId]);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found", traceId: session.traceId } }, { status: 404 });
  return NextResponse.json({ data: row });
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);
  const parsed = patchClientBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  try {
    const updated = await withPortableTransaction(async (client) => {
      const beforeResult = await client.query<Record<string, unknown>>(`SELECT * FROM clients WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const before = beforeResult.rows[0];
      if (!before) return null;
      const patch = parsed.data;
      const clauses: string[] = []; const params: unknown[] = []; let idx = 1;
      const add = (column: string, value: unknown) => { clauses.push(`${column} = $${idx++}`); params.push(value); };
      if (patch.name !== undefined) add("name", normalizeClientName(patch.name));
      if (patch.email !== undefined) add("email", patch.email || null); if (patch.phone !== undefined) add("phone", patch.phone || null); if (patch.notes !== undefined) add("notes", patch.notes || null);
      if (patch.company_name !== undefined) add("company_name", patch.company_name || null); if (patch.address_line1 !== undefined) add("address_line1", patch.address_line1 || null); if (patch.city !== undefined) add("city", patch.city || null); if (patch.state !== undefined) add("state", patch.state || null); if (patch.zip !== undefined) add("zip", patch.zip || null);
      if (patch.relationship_type !== undefined) add("relationship_type", patch.relationship_type); if (patch.travel_rule !== undefined) add("travel_rule", patch.travel_rule); if (patch.custom_included_one_way_miles !== undefined) add("custom_included_one_way_miles", patch.custom_included_one_way_miles); if (patch.custom_mileage_rate_cents !== undefined) add("custom_mileage_rate_cents", patch.custom_mileage_rate_cents); if (patch.custom_travel_time_rate_cents !== undefined) add("custom_travel_time_rate_cents", patch.custom_travel_time_rate_cents); if (patch.minimum_project_value_exempt !== undefined) add("minimum_project_value_exempt", patch.minimum_project_value_exempt);
      params.push(id, session.accountId);
      await client.query(`UPDATE clients SET ${clauses.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx++} AND account_id = $${idx}`, params);
      const afterResult = await client.query<Record<string, unknown>>(`SELECT * FROM clients WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const after = afterResult.rows[0]; if (!after) throw new Error("Updated client disappeared");
      await appendAuditLog(client, { account_id: session.accountId, entity_type: "client", entity_id: id, action: "update", actor_id: session.userId, trace_id: session.traceId, old_value: before, new_value: after });
      return after;
    });
    if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found", traceId: session.traceId } }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    logger.error("[clients PATCH]", err, { traceId: session.traceId, clientId: id });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update client", traceId: session.traceId } }, { status: 500 });
  }
});

export const DELETE = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);
  try {
    const result = await withPortableTransaction(async (client) => {
      const existingResult = await client.query<{ id: string; name: string }>(`SELECT id, name FROM clients WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const existing = existingResult.rows[0]; if (!existing) return { kind: "missing" as const };
      const depsResult = await client.query<{ job_count: number|string; estimate_count: number|string; invoice_count: number|string; property_count: number|string }>(
        `SELECT (SELECT COUNT(*) FROM jobs WHERE client_id = $1 AND account_id = $2) AS job_count,
                (SELECT COUNT(*) FROM estimates WHERE client_id = $1 AND account_id = $2) AS estimate_count,
                (SELECT COUNT(*) FROM invoices WHERE client_id = $1 AND account_id = $2) AS invoice_count,
                (SELECT COUNT(*) FROM properties WHERE client_id = $1 AND account_id = $2) AS property_count`, [id, session.accountId]);
      const d = depsResult.rows[0]; const blocked: string[] = [];
      if (Number(d.job_count)>0) blocked.push(`${d.job_count} job(s)`); if (Number(d.estimate_count)>0) blocked.push(`${d.estimate_count} estimate(s)`); if (Number(d.invoice_count)>0) blocked.push(`${d.invoice_count} invoice(s)`); if (Number(d.property_count)>0) blocked.push(`${d.property_count} propert(ies)`);
      if (blocked.length) return { kind: "blocked" as const, name: existing.name, blocked };
      await client.query(`DELETE FROM clients WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      await appendAuditLog(client, { account_id: session.accountId, entity_type: "client", entity_id: id, action: "delete", actor_id: session.userId, trace_id: session.traceId, old_value: { name: existing.name } });
      return { kind: "deleted" as const };
    });
    if (result.kind === "missing") return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found", traceId: session.traceId } }, { status: 404 });
    if (result.kind === "blocked") return NextResponse.json({ error: { code: "DEPENDENT_RECORDS", message: `Cannot delete client "${result.name}" — ${result.blocked.join(", ")} still reference it.`, traceId: session.traceId } }, { status: 409 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    logger.error("[clients DELETE]", err, { traceId: session.traceId, clientId: id });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete client", traceId: session.traceId } }, { status: 500 });
  }
});
