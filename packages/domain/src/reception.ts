/** Provider-neutral customer-access contracts; channels are adapters only. */

export type ReceptionStage = "CAPTURED" | "QUALIFIED" | "TRIAGED" | "HANDOFF_REQUIRED" | "BOOKING_PENDING" | "BOOKED" | "RECOVERABLE";
export type ReceptionUrgency = "STANDARD" | "URGENT" | "EMERGENCY";

export type ReceptionContext = {
  company_id: string;
  actor_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type CustomerAccessCase = {
  company_id: string;
  case_id: string;
  stage: ReceptionStage;
  urgency: ReceptionUrgency;
  contact_ref: string;
  service_request_ref: string | null;
  revision: number;
};

export type BookingIntent = {
  kind: "BOOKING_INTENT";
  company_id: string;
  case_id: string;
  idempotency_key: string;
  correlation_id: string;
  requires_authorized_confirmation: true;
};

function required(value: string, name: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name}_required`);
  return value;
}

export function assertReceptionContext(context: ReceptionContext): ReceptionContext {
  required(context.company_id, "reception_company_id");
  required(context.actor_id, "reception_actor_id");
  required(context.correlation_id, "reception_correlation_id");
  required(context.idempotency_key, "reception_idempotency_key");
  return context;
}

export function planBookingIntent(context: ReceptionContext, accessCase: CustomerAccessCase): BookingIntent {
  assertReceptionContext(context);
  if (accessCase.company_id !== context.company_id) throw new Error("reception_company_mismatch");
  if (!["QUALIFIED", "TRIAGED", "HANDOFF_REQUIRED", "RECOVERABLE"].includes(accessCase.stage)) {
    throw new Error("reception_case_not_bookable");
  }
  if (accessCase.urgency === "EMERGENCY") throw new Error("reception_emergency_requires_triage");
  return {
    kind: "BOOKING_INTENT",
    company_id: accessCase.company_id,
    case_id: accessCase.case_id,
    idempotency_key: context.idempotency_key,
    correlation_id: context.correlation_id,
    requires_authorized_confirmation: true,
  };
}

export function nextReceptionStage(
  current: CustomerAccessCase,
  next: ReceptionStage,
  context: ReceptionContext,
): CustomerAccessCase {
  assertReceptionContext(context);
  if (current.company_id !== context.company_id) throw new Error("reception_company_mismatch");
  if (next === "BOOKED" && current.stage !== "BOOKING_PENDING") throw new Error("reception_booking_confirmation_required");
  if (next === "BOOKING_PENDING" && !["QUALIFIED", "TRIAGED", "HANDOFF_REQUIRED", "RECOVERABLE"].includes(current.stage)) {
    throw new Error("reception_case_not_bookable");
  }
  return { ...current, stage: next, revision: current.revision + 1 };
}

