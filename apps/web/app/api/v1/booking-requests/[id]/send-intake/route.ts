import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import { portableQuery } from "@/lib/db/portable";
import { logger } from "@/lib/logger";
import { sendEmail, appUrl, isEmailConfigured } from "@/lib/email/mailer";
import { intakeInviteEmailHtml, intakeInviteEmailText } from "@ai-fsm/email-templates";
import { logCommunication } from "@/lib/communications-log";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** Override email — required when the booking request has no email on file */
  email: z.string().email().optional(),
});

function extractId(url: string) {
  return url.match(/\/booking-requests\/([^/]+)/)?.[1] ?? null;
}

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session) => {
    const bookingRequestId = extractId(request.url);
    if (!bookingRequestId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Booking request not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }

    const parseResult = bodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request body", traceId: session.traceId } },
        { status: 400 }
      );
    }

    // Load the booking request through the portable DB seam.
    const brRows = await portableQuery<{
      id: string; account_id: string; name: string; email: string | null;
      phone: string | null; client_id: string | null;
    }>(
      `SELECT id, account_id, name, email, phone, client_id
       FROM booking_requests
       WHERE id = $1 AND account_id = $2`,
      [bookingRequestId, session.accountId]
    );

    if (!brRows[0]) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Booking request not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    const br = brRows[0];
    const email = parseResult.data.email ?? br.email;

    if (!email) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "No email address on file. Provide one in the request body.", traceId: session.traceId } },
        { status: 422 }
      );
    }

    // Check for an active (unexpired, unused) invite
    const existingInvites = await portableQuery<{ token: string; expires_at: string }>(
      `SELECT token, expires_at FROM intake_invites
       WHERE booking_request_id = $1 AND account_id = $2
         AND used_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [bookingRequestId, session.accountId]
    );

    let token: string;
    let expiresAt: string;

    if (existingInvites[0]) {
      // Reuse existing active invite
      token = existingInvites[0].token;
      expiresAt = existingInvites[0].expires_at;
    } else {
      // Create a new invite
      // Generate identity/expiry in application code: portable across PostgreSQL and MySQL/MariaDB.
      const inviteId = randomUUID();
      token = randomUUID();
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expiresAt = expiry.toISOString();
      await portableQuery(
        `INSERT INTO intake_invites
           (id, account_id, booking_request_id, token, lead_name, lead_email, lead_phone, expires_at, delivery_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'email')`,
        [inviteId, session.accountId, bookingRequestId, token, br.name, email, br.phone ?? null, expiresAt]
      );

      // Update the booking request email if it was missing
      if (!br.email && email) {
        await portableQuery(
          `UPDATE booking_requests SET email = $1 WHERE id = $2 AND account_id = $3`,
          [email, bookingRequestId, session.accountId]
        );
      }
    }

    const intakeUrl = `${appUrl()}/intake/${token}`;

    // Send the email
    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: email,
          subject: `Tell us about your project — Dovetails Services`,
          html: intakeInviteEmailHtml({ leadName: br.name, intakeUrl, expiresHours: 168 }),
          text: intakeInviteEmailText({ leadName: br.name, intakeUrl, expiresHours: 168 }),
        });

        await logCommunication({
          accountId: session.accountId,
          clientId: br.client_id ?? undefined,
          bookingRequestId,
          channel: "email",
          direction: "outbound",
          outcome: "sent",
          bodyPreview: `Intake form sent to ${email}`,
          initiatedBy: session.userId,
        });
      } catch (err) {
        logger.error("send-intake: email send failed", err as Error, { traceId: session.traceId });

        await logCommunication({
          accountId: session.accountId,
          clientId: br.client_id ?? undefined,
          bookingRequestId,
          channel: "email",
          direction: "outbound",
          outcome: "failed",
          bodyPreview: `Intake form failed to send to ${email}`,
          initiatedBy: session.userId,
        });

        return NextResponse.json(
          { error: { code: "EMAIL_FAILED", message: "Intake invite created but email failed to send. Copy the link below and share manually.", traceId: session.traceId }, token, intake_url: intakeUrl },
          { status: 207 }
        );
      }
    } else {
      logger.warn("send-intake: email not configured, returning link only", { traceId: session.traceId });
    }

    return NextResponse.json({ token, intake_url: intakeUrl, expires_at: expiresAt });
  }
);
