import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
  }
  return _transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string; providerMessageId?: string; deliveryOutcome?: "not-sent" | "unknown" }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured", deliveryOutcome: "not-sent" };
  }
  try {
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
    const info = await getTransporter().sendMail({ from, ...opts });
    return { ok: true, providerMessageId: info.messageId };
  } catch (err) {
    // A timeout/disconnect may occur after SMTP accepted DATA. Only an explicit
    // rejection proves that another delivery attempt cannot duplicate a send.
    const failure = err as { message?: string; code?: string; responseCode?: number; command?: string };
    const rejected = failure.code === "EAUTH" || failure.code === "EENVELOPE" ||
      (Number.isInteger(failure.responseCode) && failure.responseCode! >= 400 && failure.responseCode! <= 599 &&
        /^(?:MAIL FROM|RCPT TO|DATA)(?:\s|$)/.test(failure.command ?? ""));
    return { ok: false, error: failure.message ?? "SMTP delivery failed", deliveryOutcome: rejected ? "not-sent" : "unknown" };
  }
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}