import { describe, expect, it } from "vitest";
import { nextReceptionStage, planBookingIntent, type CustomerAccessCase } from "./reception";

const context = { company_id: "company-a", actor_id: "agent-1", correlation_id: "corr", idempotency_key: "idem" };
const accessCase: CustomerAccessCase = {
  company_id: "company-a", case_id: "case-1", stage: "QUALIFIED", urgency: "STANDARD",
  contact_ref: "contact-1", service_request_ref: "request-1", revision: 4,
};

describe("customer-access reception contracts", () => {
  it("creates an authorized booking intent with durable correlation", () => {
    expect(planBookingIntent(context, accessCase)).toMatchObject({ kind: "BOOKING_INTENT", company_id: "company-a", requires_authorized_confirmation: true });
  });

  it("rejects cross-company and emergency booking attempts", () => {
    expect(() => planBookingIntent(context, { ...accessCase, company_id: "company-b" })).toThrow("reception_company_mismatch");
    expect(() => planBookingIntent(context, { ...accessCase, urgency: "EMERGENCY" })).toThrow("reception_emergency_requires_triage");
  });

  it("requires a booking-pending boundary before BOOKED", () => {
    expect(() => nextReceptionStage(accessCase, "BOOKED", context)).toThrow("reception_booking_confirmation_required");
    const pending = nextReceptionStage(accessCase, "BOOKING_PENDING", context);
    expect(nextReceptionStage(pending, "BOOKED", context).revision).toBe(6);
  });
});

