/**
 * Local-URL policy helpers for the Local (OpenAI-compatible) provider.
 *
 * The sidebar uses these to decide whether a user-supplied baseUrl is a
 * localhost / LAN address (no consent prompt needed) or a remote server
 * (consent prompt required, URL-scoped acknowledgement persisted).
 *
 * Kept in its own pure module so the RFC1918 / loopback / `.local`
 * classification is directly unit-testable — a regex baked into DOM
 * wiring is exactly the kind of thing that passes code review while
 * quietly excluding real user setups (PR #17 review: the earlier
 * `LOCAL_BASE_URL_PATTERN` accepted `localhost` + `*.local` only,
 * leaving every home/office NAS on 192.168.x.x out).
 */

/**
 * Trim surrounding whitespace + strip trailing slashes from a baseUrl.
 * Returns "" for nullish / empty input. Matches what the provider's
 * `stripTrailingSlash` does so the sidebar consent check compares the
 * same canonical form the runtime eventually sees.
 */
export function normalizeBaseUrl(url) {
  if (!url) return "";
  return String(url).trim().replace(/\/+$/, "");
}

/**
 * Returns true if `url` points at a loopback, link-local `*.local`, or
 * RFC1918 private address. The caller treats `true` as "no consent
 * prompt needed" and `false` as "ask before sending conversation data".
 *
 * Fails CLOSED on unparseable input: an unusable URL is treated as
 * non-local, which prompts the user before any network activity — safe
 * even if the URL would never have resolved anyway.
 */
export function isLocalLanBaseUrl(url) {
  const normalized = normalizeBaseUrl(url);
  if (!normalized) return false;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  // WHATWG `hostname` leaves IPv6 addresses wrapped in brackets (`[::1]`).
  // Strip them so the literal compare works, and keep a fallback compare
  // against the bracketed form for engines that ever disagree.
  const rawHost = parsed.hostname;
  if (!rawHost) return false;
  const host =
    rawHost.startsWith("[") && rawHost.endsWith("]")
      ? rawHost.slice(1, -1)
      : rawHost;

  if (host === "localhost" || host === "::1") return true;
  if (host.endsWith(".local")) return true;

  // 127.0.0.0/8 loopback. The whole /8 is loopback per RFC 6890, not just
  // `127.0.0.1` — users running local proxies on aliased loopback (e.g.
  // LiteLLM on `127.0.0.2` to avoid a port conflict) were previously
  // pushed through the remote-consent path. Over-digit octets can't slip
  // past this regex because WHATWG's `new URL()` already rejected any
  // host with an invalid IPv4 octet — every hostname we see here is a
  // canonical four-octet form where each octet is 0..255.
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;

  // RFC1918 private ranges (same URL-parser invariant).
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  // 172.16.0.0/12 — second octet is 16..31 inclusive.
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  return false;
}
