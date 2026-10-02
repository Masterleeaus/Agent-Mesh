import { afterEach, describe, expect, it, vi } from "vitest";
import { Resend } from "resend";

// Exercise the actual SDK contract used by the compiled marketing donor.
// The transport is always stubbed: these tests never send real email.
describe("Resend SDK compatibility", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes the existing HTML email contract and returns provider acknowledgement", async () => {
    const transport = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "message-test" }), {
      status: 200, headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", transport);
    const payload = { from: "Example <sender@example.com>", to: "recipient@example.com", subject: "Test", html: "<p>Test</p>" };
    const result = await new Resend("re_test_only").emails.send(payload);
    expect(result.data).toEqual({ id: "message-test" });
    expect(result.error).toBeNull();
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, request] = transport.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.method).toBe("POST");
    expect(JSON.parse(request.body)).toMatchObject(payload);
  });

  it("preserves provider rejection without reporting an acknowledgement", async () => {
    const error = { name: "validation_error", message: "Invalid sender" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(error), {
      status: 422, headers: { "content-type": "application/json" },
    })));
    const result = await new Resend("re_test_only").emails.send({
      from: "sender@example.com", to: "recipient@example.com", subject: "Test", html: "<p>Test</p>",
    });
    expect(result.data).toBeNull();
    expect(result.error).toMatchObject(error);
  });
});
