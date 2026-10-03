import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  companyNativeCleaningJobsManifest,
  companyNativeVisitChecklistManifest,
  companyNativeWorkOrdersManifest,
  companyNativeWorkOrdersVisitsManifest,
} from "../../../../../../../packages/storage/src/company-native-schema-manifest";
import { CompanyStorageResolutionError } from "../../../../../../../packages/storage/src/company-storage-resolver";
import { CLEANING_SERVICE_CATALOGUE } from "../../../../../../../packages/titan-platform/src/verticals/cleaning/catalogue";
import { toRetainedCleaningServiceSetupPayloadFromSelections } from "../../../../../../../packages/titan-platform/src/verticals/cleaning/onboarding";
import { getWebSessionRuntime } from "@/lib/auth/web-session-runtime";
import { readCurrentCompanyVerticalProfile } from "@/lib/company-storage/cleaning-profile-entry";
import { withVerifiedWebNativeCompanyStore } from "@/lib/company-storage/request-runtime";
import { createCleaningServiceSetupAuthorityStore } from "@/lib/company-storage/cleaning-service-setup";
import { isWebAuthSetupRequiredError } from "@/lib/auth/web-session-runtime";
import { logger } from "@/lib/logger";
import { getTraceId } from "@/lib/tracing";

export const dynamic = "force-dynamic";

const SERVICE_SETUP_SCHEMA = z.object({
  expected_revision: z.number().int().nonnegative(),
  selections: z.array(z.object({
    service_id: z.string().min(1).max(120),
    mode: z.enum(["fixed", "hourly", "quote_required"]),
    fixed_price: z.number().finite().nonnegative().nullable().optional(),
    hourly_rate: z.number().finite().nonnegative().nullable().optional(),
    minimum_charge: z.number().finite().nonnegative().nullable().optional(),
    currency: z.string().length(3).optional(),
  }).strict()).min(1),
  recurring: z.object({
    enabled: z.boolean(),
    supported_frequencies: z.array(z.enum(["weekly", "fortnightly", "monthly", "custom"])),
    default_frequency: z.enum(["weekly", "fortnightly", "monthly", "custom"]).nullable(),
  }).strict(),
}).strict();

const schemaVersions = Object.freeze([
  companyNativeCleaningJobsManifest.schema_version,
  companyNativeWorkOrdersManifest.schema_version,
  companyNativeWorkOrdersVisitsManifest.schema_version,
  companyNativeVisitChecklistManifest.schema_version,
]);

function failure(status: number, code: string, message: string, traceId: string) {
  return NextResponse.json({ error: { code, message, traceId } }, { status });
}

function unavailable(error: unknown): boolean {
  return error instanceof CompanyStorageResolutionError
    || isWebAuthSetupRequiredError(error)
    || (error instanceof Error && (error.message === "identity-registry-unavailable"
      || error.message === "native-company-schema-version-unsupported"
      || error.message === "company-placement-registry-schema-unavailable"
      || error.message.startsWith("native-company-runtime-config-required:")));
}

function authorized(role: string): boolean {
  return role === "owner" || role === "admin";
}

function assertCleaningProfile(moduleId: string | null): void {
  if (moduleId !== "titan.workforce.cleaning") throw new Error("cleaning-service-setup-profile-required");
}

async function currentSession(request: NextRequest) {
  const runtime = await getWebSessionRuntime();
  const result = await runtime.resolveRequest(request);
  return { runtime, result };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const traceId = getTraceId(request);
  try {
    const { runtime, result } = await currentSession(request);
    if (!result) return failure(401, "UNAUTHORIZED", "Authentication required", traceId);
    if (!authorized(result.session.role)) return failure(403, "FORBIDDEN", "Owner or admin access is required", traceId);
    const view = await withVerifiedWebNativeCompanyStore({
      currentSession: result,
      revalidateSession: () => runtime.resolveRequest(request),
      requiredSchemaVersions: schemaVersions,
      operation: async (storage, session) => {
        if (session.scope.kind !== "authenticated") throw new Error("cleaning-service-setup-authenticated-session-required");
        const profile = await readCurrentCompanyVerticalProfile({ scope: session.scope, storage });
        assertCleaningProfile(profile.profile?.module_id ?? null);
        const authority = createCleaningServiceSetupAuthorityStore({ scope: session.scope, storage });
        return authority.read({ company_id: session.scope.current.company_id });
      },
    });
    const catalogue = CLEANING_SERVICE_CATALOGUE.map(service => ({
      service_id: service.id,
      label: service.label,
      description: service.description,
      retained_job_type_id: service.retained_job_type_id,
      pricing_hints: service.pricing_hints.filter(mode => ["fixed", "hourly", "quote_required"].includes(mode)),
      default_pricing_hint: service.default_pricing_hint,
      quote_required: service.quote_required,
      recurring_supported: service.recurring_supported,
      unavailable_reason: service.retained_job_type_id ? null : "No retained Cleaning job type is available for this service yet.",
    }));
    return NextResponse.json({ data: view, catalogue });
  } catch (error) {
    if (unavailable(error)) return failure(503, "NATIVE_COMPANY_STORAGE_UNAVAILABLE", "Native company storage is unavailable.", traceId);
    if (error instanceof Error && error.message === "cleaning-service-setup-profile-required") {
      return failure(409, "CLEANING_PROFILE_REQUIRED", "Select the Cleaning company profile before configuring Cleaning services.", traceId);
    }
    logger.error("[Cleaning service setup GET]", error, { traceId });
    return failure(500, "INTERNAL_ERROR", "Failed to load Cleaning service setup.", traceId);
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const traceId = getTraceId(request);
  let body: unknown;
  try { body = await request.json(); }
  catch { return failure(400, "VALIDATION_ERROR", "Request body must be valid JSON.", traceId); }
  const parsed = SERVICE_SETUP_SCHEMA.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid Cleaning service setup.", details: parsed.error.issues, traceId } }, { status: 400 });

  try {
    const { runtime, result } = await currentSession(request);
    if (!result) return failure(401, "UNAUTHORIZED", "Authentication required", traceId);
    if (!authorized(result.session.role)) return failure(403, "FORBIDDEN", "Owner or admin access is required", traceId);
    const data = await withVerifiedWebNativeCompanyStore({
      currentSession: result,
      revalidateSession: () => runtime.resolveRequest(request),
      requiredSchemaVersions: schemaVersions,
      operation: async (storage, session) => {
        if (session.scope.kind !== "authenticated") throw new Error("cleaning-service-setup-authenticated-session-required");
        const profile = await readCurrentCompanyVerticalProfile({ scope: session.scope, storage });
        assertCleaningProfile(profile.profile?.module_id ?? null);
        const payload = toRetainedCleaningServiceSetupPayloadFromSelections({
          company_id: session.scope.current.company_id,
          selections: parsed.data.selections,
          recurring: parsed.data.recurring,
        });
        const authority = createCleaningServiceSetupAuthorityStore({ scope: session.scope, storage });
        return authority.save({ company_id: session.scope.current.company_id }, { ...payload, expected_revision: parsed.data.expected_revision });
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (unavailable(error)) return failure(503, "NATIVE_COMPANY_STORAGE_UNAVAILABLE", "Native company storage is unavailable.", traceId);
    if (error instanceof Error && error.message === "cleaning-service-setup-profile-required") {
      return failure(409, "CLEANING_PROFILE_REQUIRED", "Select the Cleaning company profile before configuring Cleaning services.", traceId);
    }
    if (error instanceof Error && error.message === "cleaning setup revision mismatch") {
      return failure(409, "REVISION_CONFLICT", "Cleaning service setup changed. Reload it and try again.", traceId);
    }
    if (error instanceof Error && /unknown cleaning service|no retained job type mapping|collide on retained job type|pricing|requires quote_required|fixed_price is required|hourly_rate is required|recurring|at least one cleaning service/.test(error.message)) {
      return failure(400, "VALIDATION_ERROR", error.message, traceId);
    }
    logger.error("[Cleaning service setup PUT]", error, { traceId });
    return failure(500, "INTERNAL_ERROR", "Failed to save Cleaning service setup.", traceId);
  }
}
