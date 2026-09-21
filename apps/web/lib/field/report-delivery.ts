import { randomUUID } from "crypto";
import type { DbClient } from "@/lib/db-contract";
import { appUrl } from "@/lib/email/mailer";

export type ReportDeliveryState = {
  id: string;
  access_token: string;
  recipient_email: string | null;
  delivery_count: number;
  last_queued_at: string | Date | null;
  queue_status: string | null;
  sent_at: string | Date | null;
};

export function serviceReportEmailHtml(input: {
  customerName: string;
  jobTitle: string | null;
  reportUrl: string;
  companyName?: string | null;
}): string {
  const company = escapeHtml(input.companyName?.trim() || "Your service team");
  const customer = escapeHtml(input.customerName || "there");
  const title = input.jobTitle ? `<p style="margin:0 0 16px"><strong>Service:</strong> ${escapeHtml(input.jobTitle)}</p>` : "";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
    <div style="max-width:620px;margin:0 auto;padding:28px">
      <h2 style="margin:0 0 16px">Your completed service report</h2>
      <p>Hi ${customer},</p>
      <p>${company} has completed your service visit. Your service report is ready to review.</p>
      ${title}
      <p style="margin:24px 0"><a href="${escapeAttribute(input.reportUrl)}" style="background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;display:inline-block">View service report</a></p>
      <p style="font-size:12px;color:#666">This report link is private. Please do not forward it unless you intend to share the report.</p>
    </div>
  </body></html>`;
}

export async function queueServiceReportDelivery(client: DbClient, input: {
  accountId: string;
  visitId: string;
  actorId: string;
  recipientEmail: string;
  clientId: string;
  customerName: string;
  jobTitle: string | null;
  companyName?: string | null;
}): Promise<ReportDeliveryState> {
  const existing = await client.query<{ id: string; access_token: string; delivery_count: number }>(
    `SELECT id, access_token, delivery_count
       FROM field_service_report_deliveries
      WHERE visit_id = $1 AND account_id = $2
      FOR UPDATE`,
    [input.visitId, input.accountId],
  );
  let id = existing.rows[0]?.id;
  let accessToken = existing.rows[0]?.access_token;
  let deliveryCount = Number(existing.rows[0]?.delivery_count ?? 0) + 1;
  if (!id || !accessToken) {
    id = randomUUID();
    accessToken = randomUUID();
    deliveryCount = 1;
    await client.query(
      `INSERT INTO field_service_report_deliveries
         (id, account_id, visit_id, client_id, access_token, recipient_email, delivery_count, last_queued_at, last_queued_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP,$8)`,
      [id, input.accountId, input.visitId, input.clientId, accessToken, input.recipientEmail, deliveryCount, input.actorId],
    );
  } else {
    await client.query(
      `UPDATE field_service_report_deliveries
          SET recipient_email = $1, client_id = $2, delivery_count = $3,
              last_queued_at = CURRENT_TIMESTAMP, last_queued_by = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND account_id = $6`,
      [input.recipientEmail, input.clientId, deliveryCount, input.actorId, id, input.accountId],
    );
  }

  const reportUrl = `${appUrl()}/portal/service-reports/${accessToken}`;
  const idempotencyKey = `service_report_delivery:${input.visitId}:${deliveryCount}`;
  await client.query(
    `INSERT INTO notification_queue
       (account_id, client_id, automation_type, priority, channel, to_address, subject, html_body,
        idempotency_key, entity_type, entity_id, next_attempt_at, metadata)
     VALUES ($1,$2,'service_report_delivery',40,'email',$3,$4,$5,$6,'visit',$7,CURRENT_TIMESTAMP,$8)`,
    [
      input.accountId,
      input.clientId,
      input.recipientEmail,
      input.jobTitle ? `Service report — ${input.jobTitle}` : "Your completed service report",
      serviceReportEmailHtml({ customerName: input.customerName, jobTitle: input.jobTitle, reportUrl, companyName: input.companyName }),
      idempotencyKey,
      input.visitId,
      JSON.stringify({ reportDeliveryId: id, accessToken, deliveryCount }),
    ],
  );


  return {
    id,
    access_token: accessToken,
    recipient_email: input.recipientEmail,
    delivery_count: deliveryCount,
    last_queued_at: new Date().toISOString(),
    queue_status: "pending",
    sent_at: null,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}
function escapeAttribute(value: string): string { return escapeHtml(value); }
