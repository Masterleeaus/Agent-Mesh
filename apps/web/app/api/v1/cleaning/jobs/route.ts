import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CLEANING_SERVICE_CATALOGUE } from "../../../../../../../packages/titan-platform/src/verticals/cleaning/catalogue";
import { companyNativeCleaningJobsManifest } from "../../../../../../../packages/storage/src/company-native-schema-manifest";
import { CompanyStorageResolutionError } from "../../../../../../../packages/storage/src/company-storage-resolver";
import { getWebSessionRuntime, isWebAuthSetupRequiredError } from "@/lib/auth/web-session-runtime";
import { readCurrentCompanyVerticalProfile } from "@/lib/company-storage/cleaning-profile-entry";
import { withVerifiedWebNativeCompanyStore } from "@/lib/company-storage/request-runtime";
import { logger } from "@/lib/logger";
import { getTraceId } from "@/lib/tracing";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  service_id: z.string().min(1).max(120),
  client_id: z.string().uuid(),
  property_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  scheduled_start: z.string().datetime({ offset: true }),
  scheduled_end: z.string().datetime({ offset: true }),
}).strict();

const nativeTypes = new Set(CLEANING_SERVICE_CATALOGUE
  .map(service => service.retained_job_type_id)
  .filter((id): id is string => typeof id === "string"));

function failure(status: number, code: string, message: string, traceId: string) {
  return NextResponse.json({ error: { code, message, traceId } }, { status });
}

function parseSettings(value: unknown): Record<string, unknown> {
  let parsed: unknown;
  try { parsed = typeof value === "string" ? JSON.parse(value || "{}") : value ?? {}; }
  catch { throw new Error("company-settings-invalid"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("company-settings-invalid");
  return parsed as Record<string, unknown>;
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = getTraceId(request);
  if (!process.env.TITAN_WEB_PUBLIC_ORIGIN || request.headers.get("origin") !== process.env.TITAN_WEB_PUBLIC_ORIGIN) {
    return failure(403, "ORIGIN_REJECTED", "Request origin is not allowed.", traceId);
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid Cleaning job request.", traceId } }, { status: 400 });
  const input = parsed.data;
  if (Date.parse(input.scheduled_end) <= Date.parse(input.scheduled_start)) {
    return failure(400, "VALIDATION_ERROR", "Visit end must be after its start.", traceId);
  }

  try {
    const runtime = await getWebSessionRuntime();
    const current = await runtime.resolveRequest(request);
    if (!current) return failure(401, "UNAUTHORIZED", "Authentication required", traceId);
    if (current.session.role !== "owner" && current.session.role !== "admin") {
      return failure(403, "FORBIDDEN", "Owner or admin access is required", traceId);
    }

    const result = await withVerifiedWebNativeCompanyStore({
      currentSession: current,
      revalidateSession: () => runtime.resolveRequest(request),
      requiredSchemaVersions: companyNativeCleaningJobsManifest.schema_version,
      operation: async (storage, session) => {
        if (session.scope.kind !== "authenticated") throw new Error("cleaning-job-authenticated-session-required");
        const companyId = session.scope.current.company_id;
        const actorId = session.scope.current.actor_id;
        const expectedContext = session.context;
        const assertCurrent = async () => {
          const fresh = await runtime.resolveRequest(request);
          if (!fresh || fresh.context.company_id !== expectedContext.company_id
            || fresh.context.actor_id !== expectedContext.actor_id
            || fresh.context.session_id !== expectedContext.session_id
            || fresh.context.context_revision !== expectedContext.context_revision) {
            throw new Error("native-company-session-not-current");
          }
        };
        const profile = await readCurrentCompanyVerticalProfile({ scope: session.scope, storage });
        if (profile.profile?.module_id !== "titan.workforce.cleaning") return { kind: "profile-required" as const };

        return storage.transaction(async transaction => {
          await assertCurrent();
          const row = (await transaction.query<{ settings: unknown }>(
            "SELECT settings FROM companies WHERE id=$1", [companyId],
          )).rows[0];
          if (!row) throw new Error("cleaning-job-company-not-found");
          const record = object(parseSettings(row.settings).cleaning_service_setup);
          const data = object(record?.data);
          const revision = record?.revision;
          if (record?.schema !== "titan.onboarding.cleaning-service-setup-record.v1"
            || record.company_id !== companyId || !Number.isSafeInteger(revision) || Number(revision) < 1 || !data) {
            return { kind: "setup-required" as const };
          }
          const selections = Array.isArray(data.selections) ? data.selections.map(object) : [];
          const selection = selections.find(candidate => candidate?.job_type_id === input.service_id);
          if (!nativeTypes.has(input.service_id) || !selection) return { kind: "service-not-configured" as const };
          const pricing = object(selection.pricing);
          if (!pricing || !["fixed", "hourly", "quote_required"].includes(String(pricing.mode))) {
            return { kind: "pricing-configuration-required" as const };
          }
          if (typeof pricing.currency !== "string" || !/^[A-Z]{3}$/.test(pricing.currency)) {
            return { kind: "pricing-configuration-required" as const };
          }
          if (pricing.mode === "fixed" && (typeof pricing.fixed_price !== "number" || !Number.isFinite(pricing.fixed_price) || pricing.fixed_price < 0)) {
            return { kind: "pricing-configuration-required" as const };
          }
          if (pricing.mode === "hourly" && (typeof pricing.hourly_rate !== "number" || !Number.isFinite(pricing.hourly_rate) || pricing.hourly_rate < 0)) {
            return { kind: "pricing-configuration-required" as const };
          }
          const recurrence = object(data.recurrence);
          if (!recurrence || typeof recurrence.enabled !== "boolean"
            || !Array.isArray(recurrence.supported_frequencies)
            || !Array.isArray(recurrence.supported_job_type_ids)) {
            return { kind: "setup-required" as const };
          }

          const client = (await transaction.query<{ id: string }>(
            "SELECT id FROM clients WHERE id=$1 AND company_id=$2", [input.client_id, companyId],
          )).rows[0];
          if (!client) return { kind: "client-not-found" as const };
          if (input.property_id) {
            const property = (await transaction.query<{ id: string }>(
              "SELECT id FROM properties WHERE id=$1 AND company_id=$2 AND client_id=$3",
              [input.property_id, companyId, input.client_id],
            )).rows[0];
            if (!property) return { kind: "property-not-found" as const };
          }

          const jobId = randomUUID();
          const workOrderId = randomUUID();
          const visitId = randomUUID();
          const pricingSnapshot = JSON.stringify({
            mode: pricing.mode,
            fixed_price: pricing.mode === "fixed" ? pricing.fixed_price : null,
            hourly_rate: pricing.mode === "hourly" ? pricing.hourly_rate : null,
            minimum_charge: typeof pricing.minimum_charge === "number" ? pricing.minimum_charge : null,
            currency: pricing.currency,
          });
          const serviceRecurrenceEnabled = recurrence.enabled && recurrence.supported_job_type_ids.includes(input.service_id);
          const recurrenceSnapshot = JSON.stringify({
            enabled: serviceRecurrenceEnabled,
            supported_frequencies: serviceRecurrenceEnabled ? recurrence.supported_frequencies : [],
            default_frequency: serviceRecurrenceEnabled ? recurrence.default_frequency ?? null : null,
            supported_job_type_ids: serviceRecurrenceEnabled ? [input.service_id] : [],
          });
          await transaction.query(
            `INSERT INTO jobs(id,company_id,client_id,property_id,title,created_by,scheduled_start,scheduled_end,
              service_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [jobId, companyId, input.client_id, input.property_id ?? null, input.title, actorId,
              input.scheduled_start, input.scheduled_end, input.service_id, revision, pricingSnapshot, recurrenceSnapshot],
          );
          await transaction.query(
            "INSERT INTO work_orders(id,company_id,job_id,client_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)",
            [workOrderId, companyId, jobId, input.client_id, input.title, actorId],
          );
          await transaction.query(
            `INSERT INTO visits(id,company_id,job_id,scheduled_start,scheduled_end,work_order_id)
             VALUES($1,$2,$3,$4,$5,$6)`,
            [visitId, companyId, jobId, input.scheduled_start, input.scheduled_end, workOrderId],
          );
          await assertCurrent();
          return { kind: "created" as const, company_id: companyId, job_id: jobId, work_order_id: workOrderId,
            visit_id: visitId, service_id: input.service_id, service_setup_revision: revision,
            pricing_snapshot: JSON.parse(pricingSnapshot), recurrence_snapshot: JSON.parse(recurrenceSnapshot) };
        });
      },
    });
    if (result.kind === "profile-required") return failure(409, "CLEANING_PROFILE_REQUIRED", "Select the Cleaning company profile first.", traceId);
    if (result.kind === "setup-required") return failure(409, "SERVICE_SETUP_REQUIRED", "Configure and save Cleaning service setup first.", traceId);
    if (result.kind === "service-not-configured") return failure(409, "SERVICE_NOT_CONFIGURED", "Select a configured Cleaning service.", traceId);
    if (result.kind === "pricing-configuration-required") return failure(409, "PRICING_CONFIGURATION_REQUIRED", "Complete the selected service pricing configuration first.", traceId);
    if (result.kind === "client-not-found") return failure(404, "CLIENT_NOT_FOUND", "The client is not available in this company.", traceId);
    if (result.kind === "property-not-found") return failure(404, "PROPERTY_NOT_FOUND", "The property is not available for this client in this company.", traceId);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof CompanyStorageResolutionError || isWebAuthSetupRequiredError(error)
      || (error instanceof Error && (error.message === "identity-registry-unavailable"
        || error.message === "native-company-schema-version-unsupported"
        || error.message === "company-placement-registry-schema-unavailable"
        || error.message.startsWith("native-company-runtime-config-required:")))) {
      return failure(503, "NATIVE_COMPANY_STORAGE_UNAVAILABLE", "Native company storage is unavailable.", traceId);
    }
    if (error instanceof Error && error.message === "cleaning-service-setup-profile-required") {
      return failure(409, "CLEANING_PROFILE_REQUIRED", "Select the Cleaning company profile first.", traceId);
    }
    if (error instanceof Error && error.message === "native-company-session-not-current") {
      return failure(401, "UNAUTHORIZED", "The authenticated company changed. Reload before creating this job.", traceId);
    }
    logger.error("[Cleaning native job POST]", error, { traceId });
    return failure(500, "INTERNAL_ERROR", "Failed to create the Cleaning job and visit.", traceId);
  }
}
