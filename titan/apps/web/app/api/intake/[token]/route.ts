import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";
import { scoreSiteVisitProbability } from "@ai-fsm/domain";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  service_category: z.string().min(1),
  service_description: z.string().min(20).max(5000),
  intake_metadata: z.record(z.string()).default({}),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  preferred_date: z.string().nullable().optional(),
  preferred_time_slot: z.enum(["morning", "afternoon", "evening", "flexible"]).default("flexible"),
  referral_source: z.string().nullable().optional(),
  referral_name: z.string().nullable().optional(),
  brokerage_name: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const parseResult = bodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid form data", details: parseResult.error.flatten() } },
      { status: 400 }
    );
  }

  const input = parseResult.data;

  try {
    return await withPortableTransaction(async (client) => {
      const { rows: inviteRows } = await client.query<{
        id: string; account_id: string; booking_request_id: string | null;
        lead_name: string; lead_email: string; used_at: string | null; expires_at: string;
      }>(
        `SELECT id, account_id, booking_request_id, lead_name, lead_email, used_at, expires_at
         FROM intake_invites
         WHERE token = $1
         FOR UPDATE`,
        [token],
      );

      const invite = inviteRows[0];
      if (!invite) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Invalid intake link." } }, { status: 404 });
      }
      if (invite.used_at) {
        return NextResponse.json({ error: { code: "ALREADY_USED", message: "This form has already been submitted." } }, { status: 409 });
      }
      if (new Date(invite.expires_at).getTime() <= Date.now()) {
        return NextResponse.json({ error: { code: "EXPIRED", message: "This link has expired. Please contact Dovetails Services for a new link." } }, { status: 410 });
      }

      await client.query(
        `UPDATE intake_invites SET used_at = now() WHERE id = $1 AND account_id = $2 AND used_at IS NULL`,
        [invite.id, invite.account_id],
      );

      const score = scoreSiteVisitProbability({
        service_category: input.service_category,
        service_description: input.service_description,
        intake_metadata: input.intake_metadata,
      });

      if (invite.booking_request_id) {
        await client.query(
          `UPDATE booking_requests
           SET service_category = $1,
               service_description = $2,
               intake_metadata = $3,
               address = COALESCE($4, address),
               city = COALESCE($5, city),
               zip = COALESCE($6, zip),
               preferred_date = COALESCE($7, preferred_date),
               preferred_time_slot = $8,
               routing_path = $9,
               walkthrough_score = $10,
               name = $11,
               email = COALESCE(NULLIF($12, ''), email),
               phone = COALESCE(NULLIF($13, ''), phone),
               referral_source = COALESCE($15, referral_source),
               referral_name = COALESCE($16, referral_name),
               brokerage_name = COALESCE($17, brokerage_name),
               updated_at = now()
           WHERE id = $14 AND account_id = $18`,
          [
            input.service_category,
            input.service_description,
            JSON.stringify(input.intake_metadata),
            input.address || null,
            input.city || null,
            input.zip || null,
            input.preferred_date || null,
            input.preferred_time_slot,
            score.path,
            score.score,
            input.name,
            input.email || null,
            input.phone || null,
            invite.booking_request_id,
            input.referral_source || null,
            input.referral_name || null,
            input.brokerage_name || null,
            invite.account_id,
          ],
        );
      }

      logger.info("intake submit: client completed intake form", {
        inviteId: invite.id,
        bookingRequestId: invite.booking_request_id,
        accountId: invite.account_id,
        routingPath: score.path,
        score: score.score,
      });

      return NextResponse.json({ ok: true });
    });
  } catch (err) {
    logger.error("intake submit: error processing intake form", err as Error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to process intake. Please try again." } }, { status: 500 });
  }
}
