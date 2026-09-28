import test from "node:test";
import assert from "node:assert/strict";
import { createCounterfactualBranch, compareCounterfactualBranches, assertCounterfactualCannotEnterFactual } from "../.test-dist/counterfactual-branch.js";
const input={branch_id:"b1",company_id:"co-1",parent_evidence_checkpoint:"ev-1",assumptions:["price +5%"],provenance_ref:"model:m1",created_at:"2026-02-01T00:00:00Z"};
test("creates isolated counterfactual branch",()=>{const b=createCounterfactualBranch(input); assert.equal(b.classification,"COUNTERFACTUAL"); assert.equal(b.authority_granted,false); assert.deepEqual(compareCounterfactualBranches([b],"co-1").branch_ids,["b1"]);});
test("rejects cross-company comparison and duplicate ids",()=>{const b=createCounterfactualBranch(input); assert.throws(()=>compareCounterfactualBranches([b,{...b,company_id:"co-2",branch_id:"b2"}],"co-1"),/branch-company-mismatch/); assert.throws(()=>compareCounterfactualBranches([b,b],"co-1"),/branch-id-duplicate/);});
test("blocks factual or authoritative promotion",()=>{assert.throws(()=>assertCounterfactualCannotEnterFactual({classification:"FACTUAL",authority_granted:false}),/classification/); assert.throws(()=>assertCounterfactualCannotEnterFactual({classification:"COUNTERFACTUAL",authority_granted:true}),/authority/);});

