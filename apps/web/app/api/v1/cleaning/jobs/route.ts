import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { companyNativeCleaningJobsManifest } from "../../../../../../../packages/storage/src/company-native-schema-manifest";
import { CompanyStorageResolutionError } from "../../../../../../../packages/storage/src/company-storage-resolver";
import type { CurrentWebSession } from "../../../../../lib/auth/current-session";
import { getWebSessionRuntime, isWebAuthSetupRequiredError } from "../../../../../lib/auth/web-session-runtime";
import { createCleaningNativeJob } from "../../../../../lib/company-storage/cleaning-native-jobs";
import { withVerifiedWebNativeCompanyStore } from "../../../../../lib/company-storage/request-runtime";
import { logger } from "../../../../../lib/logger";
import { getTraceId } from "../../../../../lib/tracing";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  service_id: z.string().min(1).max(120),
  expected_setup_revision: z.number().int().positive(),
  client_id: z.string().uuid(),
  property_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  scheduled_start: z.string().datetime({ offset: true }),
  scheduled_end: z.string().datetime({ offset: true }),
}).strict();

function failure(status: number, code: string, message: string, traceId: string) {
  return NextResponse.json({ error: { code, message, traceId } }, { status });
}

function sameGeneration(a: CurrentWebSession | null, b: CurrentWebSession | null): boolean {
  return !!a && !!b && a.context.company_id === b.context.company_id
    && a.context.actor_id === b.context.actor_id
    && a.context.session_id === b.context.session_id
    && a.context.session_revision === b.context.session_revision
    && a.context.context_revision === b.context.context_revision;
}

function unavailable(error: unknown): boolean {
  return error instanceof CompanyStorageResolutionError || isWebAuthSetupRequiredError(error)
    || (error instanceof Error && (error.message === "identity-registry-unavailable"
      || error.message === "native-company-schema-version-unsupported"
      || error.message === "company-placement-registry-schema-unavailable"
      || error.message.startsWith("native-company-runtime-config-required:")));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = getTraceId(request);
  const publicOrigin = process.env.TITAN_WEB_PUBLIC_ORIGIN?.trim();
  if (!publicOrigin || request.headers.get("origin") !== publicOrigin) {
    return failure(403, "ORIGIN_REJECTED", "Request origin is not allowed.", traceId);
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: {
    code: "VALIDATION_ERROR", message: "Invalid Cleaning job request.", traceId,
  } }, { status: 400 });
  if (Date.parse(parsed.data.scheduled_end) <= Date.parse(parsed.data.scheduled_start)) {
    return failure(400, "VALIDATION_ERROR", "Visit end must be after its start.", traceId);
  }

  try {
    const runtime = await getWebSessionRuntime();
    const current = await runtime.resolveRequest(request);
    if (!current) return failure(401, "UNAUTHORIZED", "Authentication required.", traceId);
    if (current.session.role !== "owner" && current.session.role !== "admin") {
      return failure(403, "FORBIDDEN", "Owner or admin access is required.", traceId);
    }
    const result = await withVerifiedWebNativeCompanyStore({
      currentSession: current,
      revalidateSession: () => runtime.resolveRequest(request),
      requiredSchemaVersions: companyNativeCleaningJobsManifest.schema_version,
      operation: (storage, session) => createCleaningNativeJob({
        storage,
        currentSession: session,
        request: parsed.data,
        async assertCurrent() {
          const fresh = await runtime.resolveRequest(request);
          if (!sameGeneration(current, fresh) || !sameGeneration(session, fresh)) {
            throw new Error("native-company-session-not-current");
          }
        },
      }),
    });
    if (result.kind === "company-not-found") return failure(404, "COMPANY_NOT_FOUND", "Company is not available.", traceId);
    if (result.kind === "setup-required") return failure(409, "SERVICE_SETUP_REQUIRED", "Configure and save Cleaning setup first.", traceId);
    if (result.kind === "setup-invalid") return failure(409, "SERVICE_SETUP_INVALID", "Saved Cleaning setup is invalid; reload and correct it.", traceId);
    if (result.kind === "stale-setup") return failure(409, "STALE_SERVICE_SETUP", "Cleaning setup changed; reload it before creating the job.", traceId);
    if (result.kind === "service-not-configured") return failure(409, "SERVICE_NOT_CONFIGURED", "Select exactly one configured Cleaning service.", traceId);
    if (result.kind === "client-not-found") return failure(404, "CLIENT_NOT_FOUND", "Client is not available in this company.", traceId);
    if (result.kind === "property-not-found") return failure(404, "PROPERTY_NOT_FOUND", "Property is not available for this client.", traceId);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (unavailable(error)) return failure(503, "NATIVE_COMPANY_STORAGE_UNAVAILABLE", "Native company storage is unavailable.", traceId);
    if (error instanceof Error && (error.message === "native-company-session-not-current"
      || error.message === "native-company-session-scope-mismatch")) {
      return failure(401, "UNAUTHORIZED", "The authenticated company changed. Reload before creating this job.", traceId);
    }
    logger.error("[native Cleaning job POST]", error, { traceId });
    return failure(500, "INTERNAL_ERROR", "Failed to create the Cleaning job and visit.", traceId);
  }
}
