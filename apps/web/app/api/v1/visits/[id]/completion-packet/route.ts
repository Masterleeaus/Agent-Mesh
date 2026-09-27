import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { getDatabaseDialect } from "@/lib/db";
import { withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const completionPacketBody = z.object({
  photo_urls: z.array(z.string().min(1)).default([]),
  signature_url: z.string().min(1).nullable().optional(),
  signature_waiver: z.boolean().default(false),
  notes: z.string().max(2000).nullable().optional(),
  photos_waived: z.boolean().default(false),
  photos_waiver_reason: z.string().max(500).nullable().optional(),
});

export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = request.url.match(/\/visits\/([^/]+)\/completion-packet/)?.[1];
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const parsed = completionPacketBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  const data = parsed.data;
  if (data.photos_waived && !data.photos_waiver_reason?.trim()) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "photos_waiver_reason is required when photos_waived is true", traceId: session.traceId } }, { status: 422 });
  try {
    const packet = await withPortableTransaction(async (client) => {
      const visitResult = await client.query<{ id: string; assigned_user_id: string | null; status: string }>(`SELECT id, assigned_user_id, status FROM visits WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const visit = visitResult.rows[0];
      if (!visit || (session.role === "tech" && visit.assigned_user_id !== session.userId)) throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
      if (visit.status === "completed" || visit.status === "cancelled") throw Object.assign(new Error("IMMUTABLE_ENTITY"), { status: 409 });
      const existing = await client.query<{ id: string }>(`SELECT id FROM completion_packets WHERE visit_id = $1 AND account_id = $2`, [id, session.accountId]);
      const photoValue = getDatabaseDialect() === "mysql" ? JSON.stringify(data.photo_urls) : data.photo_urls;
      if (existing.rows[0]) {
        await client.query(`UPDATE completion_packets SET photo_urls = $1, signature_url = $2, signature_waiver = $3, notes = $4, photos_waived = $5, photos_waiver_reason = $6 WHERE id = $7 AND account_id = $8`, [photoValue, data.signature_url || null, data.signature_waiver, data.notes || null, data.photos_waived, data.photos_waiver_reason || null, existing.rows[0].id, session.accountId]);
      } else {
        await client.query(`INSERT INTO completion_packets (id, account_id, visit_id, photo_urls, signature_url, signature_waiver, notes, photos_waived, photos_waiver_reason, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [randomUUID(), session.accountId, id, photoValue, data.signature_url || null, data.signature_waiver, data.notes || null, data.photos_waived, data.photos_waiver_reason || null, session.userId]);
      }
      const rows = await client.query<Record<string, unknown>>(`SELECT * FROM completion_packets WHERE visit_id = $1 AND account_id = $2`, [id, session.accountId]);
      return rows.rows[0];
    });
    return NextResponse.json({ data: packet });
  } catch (err) {
    const status = Number((err as { status?: number }).status ?? 500);
    if (status === 404) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status });
    if (status === 409) return NextResponse.json({ error: { code: "IMMUTABLE_ENTITY", message: "Cannot update completion packet for a closed visit", traceId: session.traceId } }, { status });
    logger.error("[completion packet PATCH]", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save completion packet", traceId: session.traceId } }, { status: 500 });
  }
});
