import test from "node:test";
import assert from "node:assert/strict";
import { createDeveloperAccess, recordDeveloperDiagnostic, assertDiagnosticCompany } from "../.test-dist/developer-portal.js";
const access=createDeveloperAccess({company_id:"co-1",actor_id:"dev-1",scopes:["diagnostic"],expires_at:"2026-12-01T00:00:00Z"});
test("creates scoped authority-neutral access and redacted diagnostic",()=>{const d=recordDeveloperDiagnostic({diagnostic_id:"d1",company_id:"co-1",scope:"diagnostic",subject_ref:"service:1",status:"observed",summary:"healthy",redacted_details:["token=[REDACTED]"],created_at:"2026-02-01T00:00:00Z"},access);assert.equal(access.authority_granted,false);assert.equal(assertDiagnosticCompany(d,"co-1"),true);});
test("rejects cross-company and out-of-scope diagnostics",()=>{assert.throws(()=>recordDeveloperDiagnostic({diagnostic_id:"d",company_id:"co-2",scope:"diagnostic",subject_ref:"x",status:"unknown",summary:"x",redacted_details:[]},access),/company-mismatch/);assert.throws(()=>recordDeveloperDiagnostic({diagnostic_id:"d",company_id:"co-1",scope:"read",subject_ref:"x",status:"unknown",summary:"x",redacted_details:[]},access),/scope-denied/);});
test("requires non-expired access metadata",()=>assert.throws(()=>createDeveloperAccess({company_id:"co-1",actor_id:"dev",scopes:["read"],expires_at:"bad"}),/expires_at-invalid/));

