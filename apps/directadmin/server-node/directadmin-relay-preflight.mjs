import net from "node:net";

const PREFLIGHT_SCHEMA = "titan.server-node.directadmin-relay-preflight.v1";
const CANDIDATE_HOST = "server-216-219-85-159.da.direct";
const BLOCKED_TITAN_HOST = "titanzero.io";

export const DIRECTADMIN_RELAY_EVIDENCE_GATES = Object.freeze([
  Object.freeze({
    id: "panel-origin-and-cookie-boundary",
    owners: Object.freeze(["#1049", "#1050", "#811", "#812"]),
    inputs: Object.freeze([
      "one exact HTTPS :2222 origin shared by #1049 session configuration, #1050 page integration, and #811 HostedWorkforceDependencies.directAdmin.publicOrigin",
      "owner-approved cookie scope and sanitized direct observations of the selected host on :2222 and :443",
      "browser verification with a synthetic host-only cookie that demonstrates the approved panel boundary without using a real session",
    ]),
  }),
  Object.freeze({
    id: "directadmin-raw-serialization",
    owners: Object.freeze(["#812", "DirectAdmin operator"]),
    inputs: Object.freeze([
      "actual target DirectAdmin version and a disposable role RAW run proving HEADERS encoding, duplicate handling, and POST stdin framing",
      "synthetic non-secret request sentinels only, with separate Set-Cookie/status response behavior recorded",
    ]),
  }),
  Object.freeze({
    id: "fixed-private-workforce-transport",
    owners: Object.freeze(["#811", "#812"]),
    inputs: Object.freeze([
      "the exact #811 gateway host/port is fixed by operator configuration; current Compose publishes Workforce only on host loopback, and the relay target is never derived from request data",
      "from the DirectAdmin host, literal loopback only for same-host placement, or remote DNS answers limited to RFC1918 IPv4 and ULA IPv6; reject loopback, link-local, public/reserved, and any mixed unsafe answer, with verified HTTPS hostname/certificate",
      "future fixed-target runtime validation must enforce placement and address policy, and prove the exact route is reachable without opening public 3010/3015 or forwarding credentials over remote plain HTTP",
    ]),
  }),
  Object.freeze({
    id: "workforce-bootstrap-header-compatibility",
    owners: Object.freeze(["#811", "#1049"]),
    inputs: Object.freeze([
      "the merged #811 PR #1266 forwards x-titan-da-bootstrap-csrf only for exact POST /v1/directadmin/bootstrap and includes mounted exact/near-miss tests; run those tests against the deployed module and verify real provider composition",
    ]),
  }),
  Object.freeze({
    id: "paired-sdk-relay-route-compatibility",
    owners: Object.freeze(["#1050", "#812"]),
    inputs: Object.freeze([
      "the deployed #1050 SDK/helper and #812 packaged RAW role come from a compatible source pair whose browser route map, RAW selector, and shared gateway all include POST /v1/directadmin/bootstrap",
      "rerun the extracted host integration with those exact paired artifacts and record relay/host observations; the published SDK snapshot at 31e57e11 lacks the #812 bootstrap map/selector that is present in current main after merged PR #1251",
      "the current #1050 relay-host.integration.mjs HEADERS fixture omits x-titan-da-bootstrap-csrf; test the bootstrap nonce through the exact RAW entrypoint after the owner updates the fixture, without adding unrelated cookies",
    ]),
  }),
  Object.freeze({
    id: "existing-session-bootstrap-renewal-compatibility",
    owners: Object.freeze(["#1049", "#1050", "#812"]),
    inputs: Object.freeze([
      "exercise #1049 initial bootstrap and reload/renewal when credentials: same-origin sends an existing __Host-titan-da-session cookie",
      "resolve and test the owner-approved reload protocol: the current #812 bootstrap selector rejects an incoming Titan session cookie and strips all cookies; do not enable generic cookie forwarding",
    ]),
  }),
  Object.freeze({
    id: "directadmin-source-cookie-proof-compatibility",
    owners: Object.freeze(["#302", "#1049", "#812", "#1300"]),
    inputs: Object.freeze([
      "merged #302 PR #1292 authenticates the allowlisted cookies at its pinned /api/session endpoint and consumes a durable operator-bound nonce through the existing GLOBAL_REGISTRY add-on; the nonce store still requires explicit production initialization",
      "open #1300 owns the trusted page/host composition that keeps DirectAdmin proof cookies inside the DirectAdmin trust boundary, redeems the nonce there, and sends only the verified assertion plus the same company/device to canonical session issuance; #812 must continue stripping all cookies",
    ]),
  }),
  Object.freeze({
    id: "trusted-bootstrap-proof-and-nonce",
    owners: Object.freeze(["#302", "#1049", "#1050", "#1300"]),
    inputs: Object.freeze([
      "#1292 supplies the signed proof producer and durable server-side one-time nonce flow bound to operator, origin, company, device, and current identity generation; production store initialization and provider composition remain outstanding",
      "#1300 supplies the nonce through an owner-approved trusted page integration; browser input cannot assert identity or authority and no raw DirectAdmin cookie leaves its trust boundary",
    ]),
  }),
]);

function canonicalOrigin(value, allowedProtocols) {
  if (typeof value !== "string" || value.length > 512) return null;
  let parsed;
  try { parsed = new URL(value); } catch { return null; }
  if (!allowedProtocols.includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash || value !== parsed.origin) return null;
  return parsed;
}

function normalizedHost(hostname) {
  return hostname.toLowerCase().replace(/\.+$/, "");
}

function unbracketedHost(hostname) {
  return hostname.replace(/^\[|\]$/g, "");
}

function isIpHost(hostname) {
  return net.isIP(unbracketedHost(hostname)) !== 0;
}

function isWellFormedDnsHostname(hostname) {
  if (typeof hostname !== "string" || hostname !== hostname.toLowerCase() || hostname.endsWith(".") ||
      hostname.length > 253 || hostname.includes("..") || isIpHost(hostname)) return false;
  const labels = hostname.split(".");
  return labels.length >= 2 && labels.every(label =>
    label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
}

function isTitanSiteHost(hostname) {
  const host = normalizedHost(hostname);
  return host === BLOCKED_TITAN_HOST || host.endsWith("." + BLOCKED_TITAN_HOST);
}

function isLiteralLoopback(hostname) {
  const host = unbracketedHost(hostname);
  if (net.isIPv4(host)) return Number(host.split(".", 1)[0]) === 127;
  return net.isIPv6(host) && host.toLowerCase() === "::1";
}

function isLiteralPrivate(hostname) {
  const host = unbracketedHost(hostname);
  if (net.isIPv4(host)) {
    const [a, b] = host.split(".").map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (!net.isIPv6(host)) return false;
  const address = host.toLowerCase().split("%", 1)[0];
  return (Number.parseInt(address.split(":", 1)[0] || "0", 16) & 0xfe00) === 0xfc00;
}

/**
 * Source-only review of a proposed fixed-origin configuration. It performs no
 * DNS lookup, file read, network request, or production activation. Even a
 * structurally valid proposal remains blocked pending owner-reviewed live evidence.
 */
export function inspectDirectAdminRelayPreflight(proposal) {
  const blockers = [];
  const allowedKeys = new Set([
    "schema", "public_origin", "workforce_public_origin", "workforce_origin", "workforce_placement",
  ]);
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    return result(["proposal-invalid"], null);
  }
  for (const key of Object.keys(proposal)) {
    if (!allowedKeys.has(key)) blockers.push("unexpected-config-field:" + key);
  }
  if (proposal.schema !== PREFLIGHT_SCHEMA) blockers.push("schema-invalid");

  const publicOrigin = canonicalOrigin(proposal.public_origin, ["https:"]);
  if (!publicOrigin || publicOrigin.port !== "2222" || !isWellFormedDnsHostname(publicOrigin.hostname) ||
      normalizedHost(publicOrigin.hostname) === "localhost" || normalizedHost(publicOrigin.hostname).endsWith(".localhost")) {
    blockers.push("panel-origin-must-be-canonical-https-2222-host");
  } else if (isTitanSiteHost(publicOrigin.hostname)) {
    blockers.push("panel-origin-shares-titanzero-host");
  }

  const workforcePublicOrigin = canonicalOrigin(proposal.workforce_public_origin, ["https:"]);
  if (!workforcePublicOrigin || !publicOrigin || workforcePublicOrigin.origin !== publicOrigin.origin) {
    blockers.push("workforce-public-origin-must-match-panel-origin");
  }

  const workforceOrigin = canonicalOrigin(proposal.workforce_origin, ["http:", "https:"]);
  if (!workforceOrigin) {
    blockers.push("fixed-workforce-origin-invalid");
  } else {
    if (!isIpHost(workforceOrigin.hostname) && !isWellFormedDnsHostname(workforceOrigin.hostname)) {
      blockers.push("fixed-workforce-hostname-invalid");
    }
    if (workforceOrigin.origin === publicOrigin?.origin) blockers.push("workforce-origin-must-be-separate");
    if ((publicOrigin && normalizedHost(workforceOrigin.hostname) === normalizedHost(publicOrigin.hostname)) ||
        isTitanSiteHost(workforceOrigin.hostname)) {
      blockers.push("workforce-target-must-not-share-panel-or-titanzero-host");
    }
    if (proposal.workforce_placement === "same-host") {
      if (!isLiteralLoopback(workforceOrigin.hostname)) blockers.push("same-host-target-must-be-literal-loopback");
    } else if (proposal.workforce_placement === "remote-private") {
      if (workforceOrigin.protocol !== "https:") blockers.push("remote-workforce-requires-https");
      if (net.isIP(unbracketedHost(workforceOrigin.hostname)) && !isLiteralPrivate(workforceOrigin.hostname)) {
        blockers.push("remote-workforce-literal-target-must-be-private");
      }
      if (normalizedHost(workforceOrigin.hostname) === "localhost" || normalizedHost(workforceOrigin.hostname).endsWith(".localhost")) {
        blockers.push("remote-workforce-cannot-use-localhost");
      }
    } else {
      blockers.push("workforce-placement-invalid");
    }
  }

  const candidateOnly = publicOrigin !== null && normalizedHost(publicOrigin.hostname) === CANDIDATE_HOST;
  return result(blockers, { publicOrigin, workforceOrigin, candidateOnly });
}

function result(blockers, parsed) {
  return Object.freeze({
    schema: PREFLIGHT_SCHEMA,
    state: blockers.length ? "blocked" : "live-evidence-required",
    blockers: Object.freeze([...new Set(blockers)]),
    candidate_only: parsed?.candidateOnly === true,
    canonical_public_origin: parsed?.publicOrigin?.origin ?? null,
    canonical_workforce_origin: parsed?.workforceOrigin?.origin ?? null,
    required_evidence: DIRECTADMIN_RELAY_EVIDENCE_GATES,
    production_enabled: false,
    activation_authorized: false,
    config_read: false,
    dns_queried: false,
    network_probed: false,
  });
}
