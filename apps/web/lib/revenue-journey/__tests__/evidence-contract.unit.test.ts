import { describe, expect, it } from "vitest";
import { buildBookingJobCommercialOriginEvidence } from "../booking-job-origin-evidence";
import { buildInvoicePaymentJourneyEvidence } from "../invoice-payment-evidence";
import { buildQuoteLifecycleEvidence } from "../quote-lifecycle-evidence";
import { buildRevenueJourneyCorrelation } from "../../../../../packages/titan-platform/src/ported/titan-revenue-journey/revenue-journey-correlation";

const provenance = { producer: "native-fsm", source_event_id: "event-a", observed_at: "2026-10-01T00:00:00.000Z" };
const correlation = buildRevenueJourneyCorrelation({ company_id: "company-a", quote_id: "quote-a", provenance });
const common = { company_id: "company-a", correlation, provenance, evidence_refs: ["evidence-a"] };
const booking = { ...common, booking_id: "booking-a", booking_event: "confirmed", booking_source_domain: "crm.bookings", booking_source_ref: "booking-observed-a" };
const invoice = { ...common, invoice_id: "invoice-a", invoice_state: "issued", invoice_source_domain: "crm.invoices", invoice_source_ref: "invoice-observed-a", amount_total: 1000, amount_paid: 0 };
const quote = { ...common, quote_id: "quote-a", from_state: "draft", to_state: "sent", source_domain: "crm.quotes", source_ref: "quote-observed-a" };

describe("web consumers of existing revenue evidence contracts", () => {
  it("preserves non-null canonical states and evidence without granting authority", () => {
    const b = buildBookingJobCommercialOriginEvidence(booking);
    const i = buildInvoicePaymentJourneyEvidence(invoice);
    const q = buildQuoteLifecycleEvidence(quote);
    expect(b.booking.event).toBe("confirmed");
    expect(i.invoice.state).toBe("issued");
    expect(i.amounts.outstanding).toBe(1000);
    expect(q.canonical_transition).toMatchObject({ from_state: "draft", to_state: "issued" });
    for (const result of [b, i, q]) {
      expect(result.company_id).toBe("company-a");
      expect(result.evidence_refs).toContain("evidence-a");
      expect(result.governance).toMatchObject({ authority_granted: false, execution_permitted: false });
    }
  });
  it("rejects null/missing lifecycle states rather than fabricating defaults", () => {
    expect(() => buildBookingJobCommercialOriginEvidence({ ...booking, booking_event: null })).toThrow("booking-event-invalid");
    expect(() => buildInvoicePaymentJourneyEvidence({ ...invoice, invoice_state: null })).toThrow("invoice-state-invalid");
    expect(() => buildQuoteLifecycleEvidence({ ...quote, from_state: null })).toThrow("state-invalid");
  });
  it("rejects correlation from another company", () => {
    expect(() => buildBookingJobCommercialOriginEvidence({ ...booking, company_id: "company-b" })).toThrow("cross-company");
    expect(() => buildInvoicePaymentJourneyEvidence({ ...invoice, company_id: "company-b" })).toThrow("cross-company");
    expect(() => buildQuoteLifecycleEvidence({ ...quote, company_id: "company-b" })).toThrow("cross-company");
  });
  it("rejects acknowledged payment as reconciliation verification", () => {
    expect(() => buildInvoicePaymentJourneyEvidence({ ...invoice, payment_id: "payment-a", payment_state: "pending", payment_source_domain: "finance.payments", payment_source_ref: "ack-a", reconciliation_verified: true })).toThrow("settled");
  });
});
