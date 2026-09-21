import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadToolRegistry, validateToolRegistry, getToolDefinition, listCleaningTools } from "../titan-tools/tool-registry.mjs";

test("30-pass programme is embedded and Pass 1 is complete", () => {
  const p = JSON.parse(fs.readFileSync(new URL("../titan-tools/cleaning-programme/PROGRAMME.json", import.meta.url), "utf8"));
  assert.equal(p.passes.length, 30);
  assert.equal(p.progress.completed_passes, 1);
  assert.equal(p.progress.next_pass, 2);
  assert.equal(p.passes[0].status, "DONE");
  assert.equal(p.passes[1].status, "NEXT");
});

test("canonical registry covers all recovered tool families", () => {
  const registry = loadToolRegistry();
  const census = JSON.parse(fs.readFileSync(new URL("../titan-tools/TOOL-CENSUS.json", import.meta.url), "utf8"));
  assert.equal(registry.tool_count, census.tools.length);
  assert.equal(registry.tools.length, 39);
  assert.ok(listCleaningTools(registry).length >= 35);
});

test("registry enforces company_id and identity-not-authority", () => {
  const registry = loadToolRegistry();
  assert.equal(validateToolRegistry(registry), true);
  for (const tool of registry.tools) {
    assert.equal(tool.company_scope.canonical_key, "company_id");
    assert.equal(tool.company_scope.legacy_keys_authoritative, false);
    assert.equal(tool.grants_execution_authority, false);
  }
});

test("cleaning metadata is usable", () => {
  const quoteWriter = getToolDefinition("write");
  assert.ok(quoteWriter.cleaning_use_cases.includes("quotes"));
  assert.ok(quoteWriter.supported_roles.includes("estimator"));
  const chemicalsResearch = getToolDefinition("search");
  assert.ok(chemicalsResearch.cleaning_use_cases.includes("products"));
});

test("bad registries fail closed", () => {
  const registry = loadToolRegistry();
  const broken = structuredClone(registry);
  broken.tools[0].company_scope.canonical_key = "tenant_id";
  assert.throws(() => validateToolRegistry(broken), /invalid-company-scope/);
  const authorityBroken = structuredClone(registry);
  authorityBroken.tools[0].grants_execution_authority = true;
  assert.throws(() => validateToolRegistry(authorityBroken), /identity-authority-violation/);
});
