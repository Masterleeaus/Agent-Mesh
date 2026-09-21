import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "../../../../../lib/auth/middleware";
import type { AuthSession } from "../../../../../lib/auth/middleware";
import { portableQueryOne, withPortableTransaction } from "../../../../../lib/db/portable";
import { appendAuditLog } from "../../../../../lib/db/audit";
import { logger } from "../../../../../lib/logger";
import { JOB_ACCEPTANCE_CATEGORIES, JOB_INTAKE_DECISIONS, VENDOR_COORDINATION_MODES } from "@ai-fsm/domain";

export const dynamic = "force-dynamic";

const updateJobBody = z.object({
  client_id: z.string().uuid().optional(),
  property_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: z.number().int().min(0).optional(),
  actual_cost_cents: z.number().int().nonnegative().nullable().optional(),
  travel_miles: z.number().nonnegative().nullable().optional(),
  job_category: z.enum(JOB_ACCEPTANCE_CATEGORIES).nullable().optional(),
  intake_decision: z.enum(JOB_INTAKE_DECISIONS).nullable().optional(),
  intake_notes: z.string().nullable().optional(),
  vendor_coordination: z.enum(VENDOR_COORDINATION_MODES).nullable().optional(),
  concierge_fee_cents: z.number().int().nonnegative().nullable().optional(),
});

export const GET = withAuth(
  async (request: NextRequest, session: AuthSession) => {
    // Extract [id] from URL since HOF wrappers don't forward route params
    const id = request.url.match(/\/jobs\/([^/]+)/)?.[1];

    if (!id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    const job = await portableQueryOne(
      `SELECT * FROM jobs WHERE id = $1 AND account_id = $2`,
      [id, session.accountId]
    );

    if (!job) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: job });
  }
);

export const PATCH = withRole(
  ["owner", "admin"],
  async (request: NextRequest, session: AuthSession) => {
    const id = request.url.match(/\/jobs\/([^/]+)/)?.[1];

    if (!id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateJobBody.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
            traceId: session.traceId,
          },
        },
        { status: 422 }
      );
    }

    try {
      const result = await withPortableTransaction(async (client) => {
        const existing = await client.query<Record<string, unknown>>(
          `SELECT * FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
          [id, session.accountId]
        );

        const old = existing.rows[0];
        if (!old) return { kind: "missing" as const };

        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        for (const [key, val] of Object.entries(parsed.data)) {
          if (val !== undefined) {
            fields.push(`${key} = $${idx++}`);
            values.push(val);
          }
        }

        if (fields.length === 0) {
          return { kind: "unchanged" as const, job: old };
        }

        values.push(id, session.accountId);
        await client.query(
          `UPDATE jobs SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx++} AND account_id = $${idx}`,
          values
        );

        const persisted = await client.query<Record<string, unknown>>(
          `SELECT * FROM jobs WHERE id = $1 AND account_id = $2`,
          [id, session.accountId],
        );
        const updated = persisted.rows[0];
        if (!updated) throw new Error("Updated job disappeared");

        await appendAuditLog(client, {
          account_id: session.accountId,
          entity_type: "job",
          entity_id: id,
          action: "update",
          actor_id: session.userId,
          trace_id: session.traceId,
          old_value: old,
          new_value: updated,
        });

        return { kind: "updated" as const, job: updated };
      });

      if (result.kind === "missing") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: result.job });
    } catch (err) {
      logger.error("[jobs PATCH]", err, { traceId: session.traceId });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to update job", traceId: session.traceId } },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRole(
  ["owner"],
  async (request: NextRequest, session: AuthSession) => {
    const id = request.url.match(/\/jobs\/([^/]+)/)?.[1];

    if (!id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    try {
      const result = await withPortableTransaction(async (client) => {
        const existing = await client.query<Record<string, unknown>>(
          `SELECT * FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
          [id, session.accountId]
        );

        const job = existing.rows[0];
        if (!job) return { kind: "missing" as const };

        if (job.status !== "draft") {
          return { kind: "conflict" as const, status: String(job.status) };
        }

        // Detach SMS/comms history so draft delete is not blocked by
        // communications_log_job_id_fkey (NO ACTION before migration 163).
        await client.query(
          `UPDATE communications_log
           SET job_id = NULL
           WHERE job_id = $1 AND account_id = $2`,
          [id, session.accountId],
        );

        await client.query(`DELETE FROM jobs WHERE id = $1 AND account_id = $2`, [id, session.accountId]);

        await appendAuditLog(client, {
          account_id: session.accountId,
          entity_type: "job",
          entity_id: id,
          action: "delete",
          actor_id: session.userId,
          trace_id: session.traceId,
          old_value: job,
        });

        return { kind: "deleted" as const };
      });

      if (result.kind === "missing") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
          { status: 404 }
        );
      }
      if (result.kind === "conflict") {
        return NextResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: `Only draft projects can be deleted (current status: ${result.status}). Cancel or complete active projects instead.`,
              traceId: session.traceId,
            },
          },
          { status: 409 }
        );
      }
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      logger.error("[jobs DELETE]", err, { traceId: session.traceId });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to delete job", traceId: session.traceId } },
        { status: 500 }
      );
    }
  }
);
