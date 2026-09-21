import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { appendAuditLog } from "@/lib/db/audit";
import { portableQueryOne, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const patchAccountBody = z
  .object({
    name: z.string().min(1).max(255).optional(),
    settings: z
      .object({
        invoice_terms: z.string().max(8000).optional(),
        estimate_terms: z.string().max(8000).optional(),
        deposit_percent: z.number().min(0).max(100).optional(),
        deposit_terms: z.string().max(2000).optional(),
        estimate_expiry_days: z.number().int().min(1).max(365).optional(),
        labor_rate_cents: z.number().int().min(0).optional(),
        material_markup_pct: z.number().min(0).max(200).optional(),
        sms_enabled: z.boolean().optional(),
        sms_sim_number: z.number().int().min(1).max(8).optional(),
      })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

function settingsObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return {};
}

export const GET = withRole(["owner", "admin"], async (_request: NextRequest, session: AuthSession) => {
  const row = await portableQueryOne(`SELECT id, name, settings, created_at FROM accounts WHERE id = $1`, [session.accountId]);
  if (!row) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Account not found", traceId: session.traceId } }, { status: 404 });
  }
  return NextResponse.json({ data: row });
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const body = await request.json().catch(() => null);
  const parsed = patchAccountBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } },
      { status: 422 },
    );
  }

  const { name, settings } = parsed.data;
  try {
    const updated = await withPortableTransaction(async (client) => {
      const beforeResult = await client.query<Record<string, unknown>>(`SELECT name, settings FROM accounts WHERE id = $1`, [session.accountId]);
      const before = beforeResult.rows[0];
      if (!before) {
        const error = new Error("ACCOUNT_NOT_FOUND");
        (error as Error & { code?: string }).code = "ACCOUNT_NOT_FOUND";
        throw error;
      }

      const setClauses: string[] = ["updated_at = NOW()"];
      const params: unknown[] = [];
      let idx = 1;
      if (name !== undefined) {
        setClauses.push(`name = $${idx++}`);
        params.push(name);
      }
      if (settings !== undefined) {
        setClauses.push(`settings = $${idx++}`);
        params.push(JSON.stringify({ ...settingsObject(before.settings), ...settings }));
      }
      params.push(session.accountId);

      await client.query(`UPDATE accounts SET ${setClauses.join(", ")} WHERE id = $${idx}`, params);
      const afterResult = await client.query<Record<string, unknown>>(`SELECT id, name, settings FROM accounts WHERE id = $1`, [session.accountId]);
      const after = afterResult.rows[0];
      if (!after) throw new Error("Account update did not return persisted row");

      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "account",
        entity_id: session.accountId,
        action: "update",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: before,
        new_value: after,
      });
      return after;
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if ((error as Error & { code?: string }).code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Account not found", traceId: session.traceId } }, { status: 404 });
    }
    logger.error("PATCH /api/v1/account error", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update account", traceId: session.traceId } }, { status: 500 });
  }
});
