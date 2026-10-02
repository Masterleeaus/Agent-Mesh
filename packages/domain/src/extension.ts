/** Versioned, least-privilege extension package contracts. */

export type ExtensionPermission = { capability_id: string; data_scopes: string[]; side_effects: string[]; offline: boolean };
export type ExtensionPackage = {
  package_id: string;
  version: string;
  source: string;
  provenance_ref: string;
  capabilities: string[];
  permissions: ExtensionPermission[];
  schema_version: string;
  dependencies: string[];
  migrations: string[];
  rollback_version: string | null;
  production_safe: boolean;
};

export type ExtensionCompatibility =
  | { kind: "COMPATIBLE"; package_id: string; from_version: string; to_version: string }
  | { kind: "REJECT"; reason: "INVALID_MANIFEST" | "CAPABILITY_MISMATCH" | "MIGRATION_REQUIRED" | "PRODUCTION_FORBIDDEN" };

export type ExtensionRollbackPlan = {
  kind: "ROLLBACK";
  package_id: string;
  target_version: string;
  receipt_id: string;
  requires_review: true;
};

function required(value: string, name: string): void {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`extension_${name}_required`);
}

export function validateExtensionPackage(pkg: ExtensionPackage): ExtensionPackage {
  for (const [key, value] of Object.entries(pkg)) if (typeof value === "string") required(value, key);
  if (!pkg.capabilities.length || !pkg.permissions.length || !pkg.schema_version) throw new Error("extension_manifest_incomplete");
  for (const permission of pkg.permissions) {
    required(permission.capability_id, "capability_id");
    if (!permission.data_scopes.length) throw new Error("extension_data_scope_required");
    if (permission.side_effects.length && !pkg.production_safe) throw new Error("extension_side_effects_not_safe");
  }
  return pkg;
}

export function checkExtensionCompatibility(
  pkg: ExtensionPackage,
  installed: { package_id: string; version: string; schema_version: string; capabilities: string[] },
): ExtensionCompatibility {
  if (pkg.package_id !== installed.package_id || pkg.schema_version !== installed.schema_version) return { kind: "REJECT", reason: "INVALID_MANIFEST" };
  if (pkg.capabilities.some(capability => !installed.capabilities.includes(capability))) return { kind: "REJECT", reason: "CAPABILITY_MISMATCH" };
  if (pkg.migrations.length && pkg.version !== installed.version) return { kind: "REJECT", reason: "MIGRATION_REQUIRED" };
  if (!pkg.production_safe) return { kind: "REJECT", reason: "PRODUCTION_FORBIDDEN" };
  return { kind: "COMPATIBLE", package_id: pkg.package_id, from_version: installed.version, to_version: pkg.version };
}

export function planExtensionRollback(pkg: ExtensionPackage, receipt_id: string): ExtensionRollbackPlan {
  required(receipt_id, "receipt_id");
  if (!pkg.rollback_version) throw new Error("extension_rollback_unavailable");
  return { kind: "ROLLBACK", package_id: pkg.package_id, target_version: pkg.rollback_version, receipt_id, requires_review: true };
}

