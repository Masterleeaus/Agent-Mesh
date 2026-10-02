import test from "node:test";import assert from "node:assert/strict";import {createDistributionManifest,transitionDistribution,projectMatrix} from "../.test-dist/distribution-gateway.js";
const base={company_id:"co-1",product_ref:"quote",vertical_ref:"hvac:v1",tier_ref:"free",capability_ids:["quote.create"],contract_versions:["api:v1"],artifact_hash:"sha256:0000000000000000000000000000000000000000000000000000000000000000",provenance_ref:"build:1"};
test("builds authority-neutral manifests and deterministic matrix projections",()=>{const m=createDistributionManifest({...base,manifest_id:"m-1",platform:"AI_HOST"});assert.equal(m.state,"BUILT");assert.equal(m.schema,"titan.distribution-manifest.v1");assert.equal(m.authorityGranted,false);assert.deepEqual(projectMatrix(base,["AI_HOST","BROWSER_EXTENSION"]).map(x=>x.platform),["AI_HOST","BROWSER_EXTENSION"]);});
test("requires verification before submission and publication",()=>{const m=createDistributionManifest({...base,manifest_id:"m-1",platform:"DEVELOPER_SDK"});assert.throws(()=>transitionDistribution(m,"PUBLISHED"),/transition/);const published=transitionDistribution(transitionDistribution(transitionDistribution(m,"VERIFIED"),"READY_TO_SUBMIT"),"SUBMITTED");assert.equal(published.state,"SUBMITTED");});

test("rejects incomplete references and malformed artifact hashes", () => {
  assert.throws(() => createDistributionManifest({ ...base, manifest_id: "m-1", product_ref: " ", platform: "AI_HOST" }), /product_ref-required/);
  assert.throws(() => createDistributionManifest({ ...base, manifest_id: "m-1", artifact_hash: "sha256:1", platform: "AI_HOST" }), /artifact-hash-invalid/);
  assert.throws(() => createDistributionManifest({ ...base, manifest_id: "m-1", capability_ids: ["quote.create", "quote.create"], platform: "AI_HOST" }), /capability-id-duplicate/);
});

test("freezes a normalized copy and rejects duplicate matrix adapters", () => {
  const capabilities = ["quote.create"];
  const manifest = createDistributionManifest({ ...base, capability_ids: capabilities, manifest_id: "m-2", platform: "DEVELOPER_SDK" });
  capabilities.push("quote.update");
  assert.deepEqual(manifest.capability_ids, ["quote.create"]);
  assert.equal(Object.isFrozen(manifest.capability_ids), true);
  assert.throws(() => projectMatrix(base, ["AI_HOST", "AI_HOST"]), /distribution-profile-duplicate/);
});

test("normalizes reference arrays with locale-independent ordering", () => {
  const manifest = createDistributionManifest({
    ...base,
    manifest_id: "m-3",
    platform: "AI_HOST",
    capability_ids: ["z.capability", "A.capability"],
    contract_versions: ["v2", "v10"],
  });
  assert.deepEqual(manifest.capability_ids, ["A.capability", "z.capability"]);
  assert.deepEqual(manifest.contract_versions, ["v10", "v2"]);
});
