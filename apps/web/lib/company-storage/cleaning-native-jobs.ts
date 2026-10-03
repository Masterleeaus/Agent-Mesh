import { randomUUID } from "node:crypto";
import { CLEANING_SERVICE_BY_ID, CLEANING_SERVICE_CATALOGUE } from "../../../../packages/titan-platform/src/verticals/cleaning/catalogue";
import type { StorageClient } from "../../../../packages/storage/src/index";
import type { CurrentWebSession } from "../auth/current-session";

export interface CleaningNativeJobInput {
  service_id: string;
  expected_setup_revision: number;
  client_id: string;
  property_id?: string | null;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
}

export type CleaningNativeJobResult =
  | { kind: "created"; company_id: string; job_id: string; job_type_id: string; work_order_id: string; visit_id: string;
      service_id: string; service_setup_revision: number; pricing_snapshot: PricingSnapshot; recurrence_snapshot: RecurrenceSnapshot }
  | { kind: "company-not-found" | "setup-required" | "setup-invalid" | "stale-setup" | "service-not-configured"
      | "client-not-found" | "property-not-found" };

interface PricingSnapshot {
  mode: "fixed" | "hourly" | "quote_required";
  fixed_price: number | null;
  hourly_rate: number | null;
  minimum_charge: number | null;
  currency: string;
}

interface RecurrenceSnapshot {
  enabled: boolean;
  supported_frequencies: string[];
  default_frequency: string | null;
  supported_job_type_ids: string[];
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function parseObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try { return object(JSON.parse(value)); } catch { return null; }
  }
  return object(value);
}

function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function buildPricingSnapshot(value: unknown, service: NonNullable<typeof CLEANING_SERVICE_BY_ID[string]>): PricingSnapshot | null {
  const pricing = object(value);
  if (!pricing || !["fixed", "hourly", "quote_required"].includes(String(pricing.mode))) return null;
  const mode = pricing.mode as PricingSnapshot["mode"];
  if (!service.pricing_hints.includes(mode) || (service.quote_required && mode !== "quote_required")) return null;
  const currency = pricing.currency;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return null;
  const fixedPrice = pricing.fixed_price;
  const hourlyRate = pricing.hourly_rate;
  const minimumCharge = pricing.minimum_charge;
  if ((fixedPrice != null && !validAmount(fixedPrice)) || (hourlyRate != null && !validAmount(hourlyRate))
    || (minimumCharge != null && !validAmount(minimumCharge))) return null;
  if (mode === "fixed" && !validAmount(fixedPrice)) return null;
  if (mode === "hourly" && !validAmount(hourlyRate)) return null;
  return Object.freeze({
    mode,
    fixed_price: mode === "fixed" ? fixedPrice as number : null,
    hourly_rate: mode === "hourly" ? hourlyRate as number : null,
    minimum_charge: minimumCharge as number | null ?? null,
    currency,
  });
}

function buildRecurrenceSnapshot(value: unknown, jobTypeId: string, serviceRecurring: boolean): RecurrenceSnapshot | null {
  const recurrence = object(value);
  if (!recurrence || typeof recurrence.enabled !== "boolean"
    || !Array.isArray(recurrence.supported_frequencies)
    || !Array.isArray(recurrence.supported_job_type_ids)) return null;
  const allowed = new Set(["weekly", "fortnightly", "monthly", "custom_recurring"]);
  const frequencies = recurrence.supported_frequencies;
  if (frequencies.some(item => typeof item !== "string" || !allowed.has(item))) return null;
  if (new Set(frequencies).size !== frequencies.length) return null;
  const jobTypes = recurrence.supported_job_type_ids;
  if (jobTypes.some(item => typeof item !== "string" || !item.trim())) return null;
  if (new Set(jobTypes).size !== jobTypes.length) return null;
  const knownJobTypes = new Set(CLEANING_SERVICE_CATALOGUE.map(item => item.retained_job_type_id).filter(Boolean));
  if (jobTypes.some(item => !knownJobTypes.has(item as string))) return null;
  const supportsService = recurrence.enabled && serviceRecurring && jobTypes.includes(jobTypeId);
  const defaultFrequency = recurrence.default_frequency;
  if (defaultFrequency != null && (typeof defaultFrequency !== "string" || !frequencies.includes(defaultFrequency))) return null;
  if (recurrence.enabled && (!frequencies.length || !jobTypes.length)) return null;
  return Object.freeze({
    enabled: supportsService,
    supported_frequencies: supportsService ? [...frequencies] as string[] : [],
    default_frequency: supportsService ? defaultFrequency as string | null ?? null : null,
    supported_job_type_ids: supportsService ? [jobTypeId] : [],
  });
}

function sessionCompany(session: CurrentWebSession): { company_id: string; actor_id: string } {
  if (session.scope.kind !== "authenticated"
    || session.context.company_id !== session.scope.current.company_id
    || session.context.actor_id !== session.scope.current.actor_id
    || session.operationCompanyIds[0] !== session.scope.current.company_id) {
    throw new Error("native-company-session-scope-mismatch");
  }
  return { company_id: session.scope.current.company_id, actor_id: session.scope.current.actor_id };
}

/**
 * Materialize one native job, work order and first visit from the saved
 * #1433 setup in the already verified company store. Caller input selects a
 * canonical service and revision only; prices and retained job type come from
 * the saved projection and one canonical service catalogue.
 */
export async function createCleaningNativeJob(input: {
  storage: StorageClient;
  currentSession: CurrentWebSession;
  request: CleaningNativeJobInput;
  assertCurrent(): Promise<void>;
}): Promise<CleaningNativeJobResult> {
  const { company_id: companyId, actor_id: actorId } = sessionCompany(input.currentSession);
  const service = CLEANING_SERVICE_BY_ID[input.request.service_id];
  const jobTypeId = service?.retained_job_type_id;
  if (!service || !jobTypeId) return { kind: "service-not-configured" };

  await input.assertCurrent();
  return input.storage.transaction(async transaction => {
    const company = (await transaction.query<{ id: string; settings: unknown }>(
      "SELECT id,settings FROM companies WHERE id=$1", [companyId],
    )).rows[0];
    if (!company) return { kind: "company-not-found" };
    const settings = parseObject(company.settings);
    if (!settings) return { kind: "setup-invalid" };
    const setup = object(settings.cleaning_service_setup);
    const setupData = object(setup?.data);
    const revision = setup?.revision;
    if (setup?.schema !== "titan.onboarding.cleaning-service-setup-record.v1"
      || setup.company_id !== companyId || !Number.isSafeInteger(revision) || Number(revision) < 1 || !setupData) {
      return { kind: "setup-required" };
    }
    if (Number(revision) !== input.request.expected_setup_revision) return { kind: "stale-setup" };
    const selections = Array.isArray(setupData.selections) ? setupData.selections.map(object) : [];
    const matching = selections.filter(selection => selection?.service_id === service.id);
    // Reject missing, duplicate and forged service→job type mappings.
    if (matching.length !== 1 || matching[0]?.enabled === false || matching[0]?.job_type_id !== jobTypeId
      || selections.some(selection => selection?.job_type_id === jobTypeId && selection.service_id !== service.id)) {
      return { kind: "service-not-configured" };
    }
    const pricing = buildPricingSnapshot(matching[0]?.pricing, service);
    const recurrence = buildRecurrenceSnapshot(setupData.recurrence, jobTypeId, service.recurring_supported);
    if (!pricing || !recurrence) return { kind: "setup-invalid" };

    const client = (await transaction.query<{ id: string }>(
      "SELECT id FROM clients WHERE id=$1 AND company_id=$2", [input.request.client_id, companyId],
    )).rows[0];
    if (!client) return { kind: "client-not-found" };
    if (input.request.property_id) {
      const property = (await transaction.query<{ id: string }>(
        "SELECT id FROM properties WHERE id=$1 AND company_id=$2 AND client_id=$3",
        [input.request.property_id, companyId, input.request.client_id],
      )).rows[0];
      if (!property) return { kind: "property-not-found" };
    }

    await input.assertCurrent();
    const jobId = randomUUID();
    const workOrderId = randomUUID();
    const visitId = randomUUID();
    const pricingSnapshot = JSON.stringify(pricing);
    const recurrenceSnapshot = JSON.stringify(recurrence);
    await transaction.query(
      `INSERT INTO jobs(id,company_id,client_id,property_id,title,created_by,scheduled_start,scheduled_end,
        service_id,job_type_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [jobId, companyId, input.request.client_id, input.request.property_id ?? null, input.request.title, actorId,
        input.request.scheduled_start, input.request.scheduled_end, service.id, jobTypeId, revision, pricingSnapshot, recurrenceSnapshot],
    );
    await transaction.query(
      "INSERT INTO work_orders(id,company_id,job_id,client_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)",
      [workOrderId, companyId, jobId, input.request.client_id, input.request.title, actorId],
    );
    await transaction.query(
      `INSERT INTO visits(id,company_id,job_id,scheduled_start,scheduled_end,work_order_id)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [visitId, companyId, jobId, input.request.scheduled_start, input.request.scheduled_end, workOrderId],
    );
    await input.assertCurrent();
    return {
      kind: "created",
      company_id: companyId,
      job_id: jobId,
      job_type_id: jobTypeId,
      work_order_id: workOrderId,
      visit_id: visitId,
      service_id: service.id,
      service_setup_revision: Number(revision),
      pricing_snapshot: pricing,
      recurrence_snapshot: recurrence,
    };
  });
}
