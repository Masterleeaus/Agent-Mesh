/** Provider-neutral connector contracts; providers never become business authority. */

export type ProviderProfile = "ACCOUNTING" | "PAYMENT" | "CRM_SYNC" | "FILE_STORAGE" | "MAPS_GEOSPATIAL" | "GENERIC_REST";
export type ProviderManifest = {
  provider_id: string;
  version: string;
  profiles: ProviderProfile[];
  capability_ids: string[];
  auth_mechanisms: string[];
  scopes: string[];
  credential_ref_required: boolean;
};

export type IntegrationConnection = {
  company_id: string;
  connection_id: string;
  provider_id: string;
  credential_ref: string | null;
  schema_version: string;
  cursor: string | null;
  status: "ACTIVE" | "REAUTH_REQUIRED" | "DISCONNECTED";
};

export type ProviderExecutionReceipt = {
  company_id: string;
  connection_id: string;
  provider_id: string;
  operation_id: string;
  idempotency_key: string;
  status: "SUCCEEDED" | "FAILED" | "AMBIGUOUS" | "DUPLICATE";
  observed_ref: string | null;
  authority_granted: false;
};

export type ProviderWebhookEnvelope = {
  company_id: string;
  connection_id: string;
  provider_id: string;
  provider_event_id: string;
  idempotency_key: string;
  signature_valid: boolean;
  replayed: boolean;
  payload_ref: string;
};

export type ProviderReconciliation =
  | { kind: "NOOP"; cursor: string | null }
  | { kind: "APPLY"; expected_cursor: string | null; observed_cursor: string | null }
  | { kind: "CONFLICT"; reason: "COMPANY_MISMATCH" | "SCHEMA_DRIFT" | "REPLAY" };

function nonEmpty(value: string, name: string): void {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`provider_${name}_required`);
}

export function assertProviderManifest(manifest: ProviderManifest): ProviderManifest {
  nonEmpty(manifest.provider_id, "provider_id");
  nonEmpty(manifest.version, "version");
  if (!manifest.profiles.length || !manifest.capability_ids.length) throw new Error("provider_manifest_incomplete");
  return manifest;
}

export function assertConnectionCredential(connection: IntegrationConnection): void {
  nonEmpty(connection.company_id, "company_id");
  nonEmpty(connection.connection_id, "connection_id");
  nonEmpty(connection.provider_id, "provider_id");
  if (connection.status === "ACTIVE" && !connection.credential_ref) throw new Error("provider_active_credential_required");
}

export function validateWebhook(envelope: ProviderWebhookEnvelope): ProviderWebhookEnvelope {
  nonEmpty(envelope.company_id, "company_id");
  nonEmpty(envelope.connection_id, "connection_id");
  nonEmpty(envelope.provider_event_id, "provider_event_id");
  nonEmpty(envelope.idempotency_key, "idempotency_key");
  if (!envelope.signature_valid) throw new Error("provider_webhook_signature_invalid");
  if (envelope.replayed) throw new Error("provider_webhook_replay");
  return envelope;
}

export function planProviderReconciliation(
  connection: IntegrationConnection,
  observed: Pick<IntegrationConnection, "company_id" | "provider_id" | "schema_version" | "cursor">,
): ProviderReconciliation {
  if (connection.company_id !== observed.company_id) return { kind: "CONFLICT", reason: "COMPANY_MISMATCH" };
  if (connection.provider_id !== observed.provider_id || connection.schema_version !== observed.schema_version) return { kind: "CONFLICT", reason: "SCHEMA_DRIFT" };
  if (observed.cursor === connection.cursor) return { kind: "NOOP", cursor: connection.cursor };
  return { kind: "APPLY", expected_cursor: connection.cursor, observed_cursor: observed.cursor };
}

