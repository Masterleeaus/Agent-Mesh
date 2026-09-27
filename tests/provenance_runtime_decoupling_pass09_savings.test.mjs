import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const m=JSON.parse(fs.readFileSync(new URL("../diagnostics/provenance/runtime-provenance-pass09-savings-and-regression.json", import.meta.url)));
test("Pass9 records exact donor savings",()=>{assert.equal(m.savings.uncompressed_bytes,70169);assert.equal(m.savings.compressed_bytes,7573)});
test("Pass9 preserves history evidence",()=>{assert.equal(m.history_retirement,"BLOCKED_AND_PRESERVED");assert.equal(m.history_reference_count,51)});
test("Pass9 preserves company and authority boundaries",()=>{assert.equal(m.regression.company_boundary,"company_id only");assert.equal(m.regression.authority_change,false)});
test("Pass9 records no workforce/recovery/capability regression",()=>{assert.equal(m.regression.workforce_regression,false);assert.equal(m.regression.recovery_regression,false);assert.equal(m.regression.capability_regression,false)});
test("Pass9 does not mutate signed marketplace package",()=>{assert.equal(m.signed_marketplace_package_mutation,false)});
