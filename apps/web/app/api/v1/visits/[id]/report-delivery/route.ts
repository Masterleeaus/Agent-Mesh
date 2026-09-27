import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { portableQueryOne, withPortableTransaction } from "@/lib/db/portable";
import { queueServiceReportDelivery, type ReportDeliveryState } from "@/lib/field/report-delivery";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ recipient_email: z.string().trim().email().max(320).optional() });

function visitId(request: NextRequest): string | null {
  return request.url.match(/\/visits\/([^/]+)\/report-delivery/)?.[1] ?? null;
}

async function loadContext(id: string, session: AuthSession) {
  const row = await portableQueryOne<{
    id: string; status: string; assigned_user_id: string | null; client_id: string | null;
    client_name: string | null; client_email: string | null; acknowledgement_email: string | null;
    job_title: string | null; account_name: string | null;
  }>(
    `SELECT v.id, v.status, v.assigned_user_id,
            j.client_id, j.title AS job_title,
            c.name AS client_name, c.email AS client_email,
            a.name AS account_name,
            ack.customer_email AS acknowledgement_email
       FROM visits v
       LEFT JOIN jobs j ON j.id = v.job_id AND j.account_id = v.account_id
       LEFT JOIN clients c ON c.id = j.client_id AND c.account_id = v.account_id
       LEFT JOIN accounts a ON a.id = v.account_id
       LEFT JOIN field_service_report_acknowledgements ack ON ack.visit_id = v.id AND ack.account_id = v.account_id
      WHERE v.id = $1 AND v.account_id = $2`,
    [id, session.accountId],
  );
  if (!row || (session.role === "tech" && row.assigned_user_id !== session.userId)) return null;
  return row;
}

async function loadDelivery(id: string, accountId: string): Promise<ReportDeliveryState | null> {
  return portableQueryOne<ReportDeliveryState>(
    `SELECT d.id, d.access_token, d.recipient_email, d.delivery_count, d.last_queued_at,
            q.status AS queue_status, q.sent_at
       FROM field_service_report_deliveries d
       LEFT JOIN notification_queue q
         ON q.idempotency_key = CONCAT('service_report_delivery:', d.visit_id, ':', d.delivery_count)
      WHERE d.visit_id = $1 AND d.account_id = $2`,
    [id, accountId],
  );
}

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = visitId(request);
  if (!id || !(await loadContext(id, session))) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  }
  return NextResponse.json({ data: await loadDelivery(id, session.accountId) });
});

export const POST = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = visitId(request);
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid recipient email", traceId: session.traceId } }, { status: 422 });
  }
  const context = await loadContext(id, session);
  if (!context) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  if (context.status !== "completed") {
    return NextResponse.json({ error: { code: "NOT_COMPLETED", message: "Service reports can be delivered after visit completion", traceId: session.traceId } }, { status: 409 });
  }
  if (!context.client_id || !context.client_name) {
    return NextResponse.json({ error: { code: "NO_CLIENT", message: "This visit has no client to deliver the report to", traceId: session.traceId } }, { status: 409 });
  }

  const allowedEmails = [context.client_email, context.acknowledgement_email].filter((v): v is string => !!v?.trim()).map((v) => v.trim().toLowerCase());
  const requested = (parsed.data.recipient_email ?? context.acknowledgement_email ?? context.client_email ?? "").trim();
  if (!requested) {
    return NextResponse.json({ error: { code: "NO_EMAIL", message: "The client does not have an email address", traceId: session.traceId } }, { status: 409 });
  }
  if (!allowedEmails.includes(requested.toLowerCase())) {
    return NextResponse.json({ error: { code: "RECIPIENT_MISMATCH", message: "Report delivery is limited to the client's saved or acknowledged email address", traceId: session.traceId } }, { status: 422 });
  }

  try {
    const delivery = await withPortableTransaction((client) => queueServiceReportDelivery(client, {
      accountId: session.accountId,
      visitId: id,
      actorId: session.userId,
      recipientEmail: requested,
      clientId: context.client_id!,
      customerName: context.client_name!,
      jobTitle: context.job_title,
      companyName: context.account_name,
    }));
    return NextResponse.json({ data: delivery }, { status: 202 });
  } catch (error) {
    logger.error("[service report delivery POST]", error, { traceId: session.traceId, visitId: id });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to queue service report", traceId: session.traceId } }, { status: 500 });
  }
});
