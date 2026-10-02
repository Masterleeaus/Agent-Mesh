import { describe, expect, it } from "vitest";
import { checkExtensionCompatibility, planExtensionRollback, validateExtensionPackage } from "./extension";

const pkg = { package_id: "pkg.forms", version: "2.0.0", source: "approved", provenance_ref: "prov-1", capabilities: ["forms.render"], permissions: [{ capability_id: "forms.render", data_scopes: ["company.forms"], side_effects: [], offline: true }], schema_version: "v1", dependencies: [], migrations: [], rollback_version: "1.0.0", production_safe: true };

describe("extension package contracts", () => {
  it("validates bounded package manifests", () => expect(validateExtensionPackage(pkg)).toEqual(pkg));
  it("rejects capability drift and proposes receipt-backed rollback", () => {
    expect(checkExtensionCompatibility(pkg, { package_id: "pkg.forms", version: "1.0.0", schema_version: "v1", capabilities: ["other"] })).toEqual({ kind: "REJECT", reason: "CAPABILITY_MISMATCH" });
    expect(planExtensionRollback(pkg, "receipt-1")).toEqual({ kind: "ROLLBACK", package_id: "pkg.forms", target_version: "1.0.0", receipt_id: "receipt-1", requires_review: true });
  });
  it("fails closed when a package lacks a safe scope", () => expect(() => validateExtensionPackage({ ...pkg, permissions: [{ ...pkg.permissions[0], data_scopes: [] }] })).toThrow("extension_data_scope_required"));
});

