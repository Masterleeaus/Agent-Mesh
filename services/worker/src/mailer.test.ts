import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.stubEnv("SMTP_HOST", "smtp.example.invalid"); vi.stubEnv("SMTP_USER", "test"); vi.stubEnv("SMTP_PASS", "test-only"); });
afterEach(() => { vi.unstubAllEnvs(); });
const message = { to: "test@example.invalid", subject: "Test", html: "<p>Test</p>" };
describe("SMTP delivery outcome evidence", () => {
  it("retains the provider message reference without claiming a business outcome", async () => {
    sendMail.mockResolvedValue({ messageId: "smtp-ack-1" });
    const { sendEmail } = await import("./mailer.js");
    expect(await sendEmail(message)).toEqual({ ok: true, providerMessageId: "smtp-ack-1" });
  });
  it("missing configuration is explicitly not sent", async () => {
    vi.stubEnv("SMTP_HOST", ""); const { sendEmail } = await import("./mailer.js");
    expect(await sendEmail(message)).toMatchObject({ ok: false, deliveryOutcome: "not-sent" });
    expect(sendMail).not.toHaveBeenCalled();
  });
  it.each([{ code: "EAUTH" }, { code: "EENVELOPE" }, { responseCode: 451, command: "DATA" }])("explicit SMTP rejection is safe to retry: %j", async details => {
    sendMail.mockRejectedValue(Object.assign(new Error("rejected"), details));
    const { sendEmail } = await import("./mailer.js");
    expect(await sendEmail(message)).toMatchObject({ ok: false, error: "rejected", deliveryOutcome: "not-sent" });
  });
  it.each([{ code: "ETIMEDOUT" }, { code: "ECONNRESET" }, { responseCode: 451 }, { responseCode: 421, command: "QUIT" }, {}])("uncertain acceptance must not be blindly retried: %j", async details => {
    sendMail.mockRejectedValue(Object.assign(new Error("connection closed"), details));
    const { sendEmail } = await import("./mailer.js");
    expect(await sendEmail(message)).toMatchObject({ ok: false, deliveryOutcome: "unknown" });
  });
});
