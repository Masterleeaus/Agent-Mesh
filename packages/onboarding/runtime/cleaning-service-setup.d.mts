export interface CleaningServiceSetupRecordInput {
  module_id: string;
  collection: string;
  record_id: string;
  expected_revision?: number;
  updated_at?: number;
  data?: unknown;
  provenance?: unknown;
}

export interface CleaningServiceSetupRecordDatabase {
  getRecord(context: unknown, locator: { module_id: string; collection: string; record_id: string }): Promise<{
    version?: number;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  } | null>;
  putRecord(context: unknown, record: CleaningServiceSetupRecordInput): Promise<{ version?: number; [key: string]: unknown }>;
}

export interface CleaningServiceSetupView {
  schema: "titan.onboarding.cleaning-service-setup.view.v1";
  company_id: string;
  revision: number;
  canonical_job_types: readonly Readonly<{ id: string; label: string; checklist: readonly string[]; requiredEvidence: readonly string[] }>[];
  selections: readonly Readonly<Record<string, unknown>>[];
  recurrence: Readonly<{ enabled: boolean; supported_frequencies: readonly string[]; default_frequency: string | null; supported_job_type_ids?: readonly string[] }>;
  grants_authority: false;
  authority_granted: false;
  execution_permitted: false;
}

export interface CleaningServiceSetupSaveResult {
  ok: true;
  company_id: string;
  revision: number;
  selected_job_types: readonly string[];
  grants_authority: false;
  authority_granted: false;
  execution_permitted: false;
}

export interface CleaningServiceSetupAuthority {
  schema: "titan.onboarding.cleaning-service-setup-authority.v1";
  company_boundary: "company_id";
  source_module: "titan.workforce.cleaning";
  source_projection: "job-types";
  grants_authority: false;
  read(context: unknown): Promise<CleaningServiceSetupView>;
  save(context: unknown, input: Record<string, unknown>): Promise<CleaningServiceSetupSaveResult>;
}

export function resolveCanonicalCleaningJobTypes(bundle: unknown): readonly Readonly<{ id: string; label: string; checklist: readonly string[]; requiredEvidence: readonly string[] }>[];
export function createCleaningServiceSetupAuthority(input: {
  database: CleaningServiceSetupRecordDatabase;
  cleaningBundle: unknown;
  clock?: () => number;
}): CleaningServiceSetupAuthority;
