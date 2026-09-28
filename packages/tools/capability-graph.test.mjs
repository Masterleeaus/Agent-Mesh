import assert from "node:assert/strict";
import { buildCapabilityGraph, certifyCapabilityGraph } from "./capability-graph.mjs";

const tool = (overrides = {}) => ({
  tool_id: "search",
  name: "Search",
  authority_class: "read_or_analysis",
  grants_execution_authority: false,
  company_scope: { canonical_key: "company_id", legacy_keys_authoritative: false },
  current_source_verification: "verified-current",
  current_sources: ["apps/web/search.ts"],
  ...overrides,
});

const registry = (tools = [tool()]) => ({
  schema: "titan-zero-tool-registry/v1",
  canonical_company_boundary: "company_id",
  tools,
});

const launchMap = (overrides = {}) => ({
  search: {
    tool_id: "search",
    owner: "titan-zero",
    action: "open:search",
    entrypoint: "chatTab.html",
    launch_contract: "titan-tool-launch/v1",
    donor_navigation: false,
    ...overrides.search,
  },
  ...overrides,
});

export function runCapabilityGraphTests() {
  const graph = buildCapabilityGraph({
    registry: registry(),
    launchMap: launchMap(),
    reachablePaths: ["apps/web/search.ts"],
  });
  assert.equal(graph.schema, "titan.zero.capability-graph.v1");
  assert.equal(graph.ok, true);
  assert.deepEqual(graph.matrix, [{
    capability_id: "search",
    owner: "packages/tools",
    implementation: "apps/web/search.ts",
    provider: "titan-zero",
    projection: "titan-zero:open:search",
    verification: "verified",
  }]);

  const historical = buildCapabilityGraph({
    registry: registry([tool({ current_source_verification: "required", current_sources: [], historical_evidence: ["static/search.png"] })]),
    launchMap: launchMap(),
    reachablePaths: ["apps/web/search.ts"],
  });
  assert.equal(historical.nodes[0].lifecycle, "compatibility-only");
  assert.ok(historical.warnings.includes("search:current-source-unverified"));

  const broken = certifyCapabilityGraph({
    registry: registry([tool(), tool({ tool_id: "search" })]),
    launchMap: { search: { ...launchMap().search, action: "" }, orphan: launchMap().search },
    reachablePaths: [],
    projections: [{ owner: "browser", generated_projection: false, capabilities: [{ id: "search", action: "open:search" }] }],
  });
  assert.equal(broken.ok, false);
  assert.ok(broken.errors.some((error) => error.code === "duplicate-capability-id"));
  assert.ok(broken.errors.some((error) => error.code === "unbound-action"));
  assert.ok(broken.errors.some((error) => error.code === "orphan-projection"));
  assert.ok(broken.errors.some((error) => error.code === "unreachable-implementation"));

  return { ok: true, tests: 15 };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(runCapabilityGraphTests()));

