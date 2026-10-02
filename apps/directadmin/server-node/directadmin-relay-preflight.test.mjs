import test from "node:test";
import assert from "node:assert/strict";
import {
  DIRECTADMIN_RELAY_EVIDENCE_GATES,
  inspectDirectAdminRelayPreflight,
} from "./directadmin-relay-preflight.mjs";

const panelOrigin = "https://server-216-219-85-159.da.direct:2222";

function proposal(overrides = {}) {
  return {
    schema: "titan.server-node.directadmin-relay-preflight.v1",
    public_origin: panelOrigin,
    workforce_public_origin: panelOrigin,
    workforce_origin: "https://workforce.internal:3010",
    workforce_placement: "remote-private",
    ...overrides,
  };
}

test("candidate host is only a candidate and a valid source proposal remains uncommissioned", () => {
  const result = inspectDirectAdminRelayPreflight(proposal());
  assert.equal(result.state, "live-evidence-required");
  assert.equal(result.candidate_only, true);
  assert.equal(result.canonical_public_origin, panelOrigin);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.production_enabled, false);
  assert.equal(result.activation_authorized, false);
  assert.equal(result.config_read, false);
  assert.equal(result.dns_queried, false);
  assert.equal(result.network_probed, false);
  assert.deepEqual(result.required_evidence.map(gate => gate.id), [
    "panel-origin-and-cookie-boundary",
    "directadmin-raw-serialization",
    "fixed-private-workforce-transport",
    "workforce-bootstrap-header-compatibility",
    "paired-sdk-relay-route-compatibility",
    "existing-session-bootstrap-renewal-compatibility",
    "directadmin-source-cookie-proof-compatibility",
    "trusted-bootstrap-proof-and-nonce",
  ]);
});

test("same titanzero.io host is rejected independent of port, case, or trailing dot", () => {
  for (const origin of [
    "https://titanzero.io:2222",
    "https://TITANZERO.IO:2222",
    "https://titanzero.io.:2222",
    "https://titanzero.io..:2222",
    "https://control.titanzero.io:2222",
    "https://titanzero.io:443",
  ]) {
    const result = inspectDirectAdminRelayPreflight(proposal({
      public_origin: origin,
      workforce_public_origin: origin,
    }));
    assert.equal(result.production_enabled, false, origin);
    assert.ok(result.blockers.length > 0, origin);
  }
});

test("panel origin must be canonical HTTPS on the DirectAdmin port with no URL extras", () => {
  for (const origin of [
    "http://panel.example.test:2222",
    "https://panel.example.test:443",
    "https://panel.example.test:2222/path",
    "https://user@panel.example.test:2222",
    "https://panel.example.test:2222?route=other",
    "https://127.0.0.1:2222",
    "https://[2001:db8::1]:2222",
    "https://localhost.:2222",
    "https://localhost..:2222",
  ]) {
    const result = inspectDirectAdminRelayPreflight(proposal({
      public_origin: origin,
      workforce_public_origin: origin,
    }));
    assert.ok(result.blockers.length > 0, origin);
    assert.equal(result.production_enabled, false, origin);
  }
});

test("#811 browser publicOrigin must match and the private target is a separate fixed origin", () => {
  const mismatchedPublic = inspectDirectAdminRelayPreflight(proposal({
    workforce_public_origin: "https://other.example.test:2222",
  }));
  assert.ok(mismatchedPublic.blockers.includes("workforce-public-origin-must-match-panel-origin"));

  for (const target of [
    "https://user:password@workforce.internal:3010",
    "https://workforce.internal:3010/path",
    "https://workforce.internal:3010?url=https://attacker.invalid",
    "https://server-216-219-85-159.da.direct:2222",
    "https://server-216-219-85-159.da.direct:443",
    "https://foo.localhost.:3010",
    "https://titanzero.io..:443",
  ]) {
    const result = inspectDirectAdminRelayPreflight(proposal({ workforce_origin: target }));
    assert.ok(result.blockers.length > 0, target);
    assert.equal(result.production_enabled, false, target);
  }
  const extra = inspectDirectAdminRelayPreflight(proposal({ caller_url: "https://attacker.invalid" }));
  assert.ok(extra.blockers.includes("unexpected-config-field:caller_url"));
});

test("same-host HTTP is loopback-only and remote targets require HTTPS", () => {
  for (const target of ["http://127.0.0.1:3010", "http://[::1]:3010"]) {
    const result = inspectDirectAdminRelayPreflight(proposal({
      workforce_origin: target,
      workforce_placement: "same-host",
    }));
    assert.equal(result.state, "live-evidence-required", target);
    assert.deepEqual(result.blockers, [], target);
    assert.equal(result.production_enabled, false, target);
  }

  for (const target of ["http://10.20.0.5:3010", "http://workforce.internal:3010"]) {
    const result = inspectDirectAdminRelayPreflight(proposal({
      workforce_origin: target,
      workforce_placement: "remote-private",
    }));
    assert.ok(result.blockers.includes("remote-workforce-requires-https"), target);
  }

  const sameHostDns = inspectDirectAdminRelayPreflight(proposal({
    workforce_origin: "https://workforce.internal:3010",
    workforce_placement: "same-host",
  }));
  assert.ok(sameHostDns.blockers.includes("same-host-target-must-be-literal-loopback"));
});

test("remote HTTPS must not target a public IP and still needs private-only live proof", () => {
  const publicIp = inspectDirectAdminRelayPreflight(proposal({
    workforce_origin: "https://203.0.113.24:3010",
  }));
  assert.ok(publicIp.blockers.includes("remote-workforce-literal-target-must-be-private"));

  const loopback = inspectDirectAdminRelayPreflight(proposal({
    workforce_origin: "https://[::1]:3010",
  }));
  assert.ok(loopback.blockers.includes("remote-workforce-literal-target-must-be-private"));

  const hostname = inspectDirectAdminRelayPreflight(proposal({
    workforce_origin: "https://workforce.internal:3010",
  }));
  assert.equal(hostname.state, "live-evidence-required");
  assert.equal(hostname.network_probed, false);
  assert.equal(hostname.production_enabled, false);
  const transportGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "fixed-private-workforce-transport");
  assert.ok(transportGate.inputs.some(input => input.includes("RFC1918 IPv4 and ULA IPv6")));
  assert.ok(transportGate.inputs.some(input => input.includes("loopback, link-local, public/reserved, and any mixed unsafe answer")));
  assert.ok(transportGate.inputs.some(input => input.includes("runtime validation must enforce placement and address policy")));
});

test("schema and unexpected fields fail the source preflight", () => {
  assert.ok(inspectDirectAdminRelayPreflight(proposal({ schema: "v1" })).blockers.includes("schema-invalid"));
  assert.ok(inspectDirectAdminRelayPreflight({
    ...proposal(),
    token: "never-configure-a-secret-here",
  }).blockers.includes("unexpected-config-field:token"));
});

test("bootstrap evidence records paired artifact readiness and reload cookie incompatibility", () => {
  const pairGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "paired-sdk-relay-route-compatibility");
  assert.ok(pairGate.owners.includes("#1050") && pairGate.owners.includes("#812"));
  assert.ok(pairGate.inputs.some(input => input.includes("POST /v1/directadmin/bootstrap")));
  assert.ok(pairGate.inputs.some(input => input.includes("31e57e11")));
  assert.ok(pairGate.inputs.some(input => input.includes("HEADERS fixture omits x-titan-da-bootstrap-csrf")));

  const renewalGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "existing-session-bootstrap-renewal-compatibility");
  assert.ok(renewalGate.owners.includes("#1049") && renewalGate.owners.includes("#812"));
  assert.ok(renewalGate.inputs.some(input => input.includes("credentials: same-origin")));
  assert.ok(renewalGate.inputs.some(input => input.includes("rejects an incoming Titan session cookie")));
  assert.ok(renewalGate.inputs.some(input => input.includes("do not enable generic cookie forwarding")));

  const proofGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "directadmin-source-cookie-proof-compatibility");
  assert.ok(proofGate.owners.includes("#302") && proofGate.owners.includes("#1049") &&
    proofGate.owners.includes("#812") && proofGate.owners.includes("#1300"));
  assert.ok(proofGate.inputs.some(input => input.includes("#1292") && input.includes("durable operator-bound nonce")));
  assert.ok(proofGate.inputs.some(input => input.includes("#1300") && input.includes("keeps DirectAdmin proof cookies inside the DirectAdmin trust boundary")));
  assert.ok(proofGate.inputs.some(input => input.includes("#812 must continue stripping all cookies")));

  const workforceGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "workforce-bootstrap-header-compatibility");
  assert.ok(workforceGate.inputs.some(input => input.includes("PR #1266")));
  assert.ok(workforceGate.inputs.some(input => input.includes("exact/near-miss tests")));
  const transportGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "fixed-private-workforce-transport");
  assert.ok(transportGate.inputs.some(input => input.includes("host loopback")));

  const trustedProofGate = DIRECTADMIN_RELAY_EVIDENCE_GATES.find(gate => gate.id === "trusted-bootstrap-proof-and-nonce");
  assert.ok(trustedProofGate.owners.includes("#302") && trustedProofGate.owners.includes("#1049") &&
    trustedProofGate.owners.includes("#1050") && trustedProofGate.owners.includes("#1300"));
});
