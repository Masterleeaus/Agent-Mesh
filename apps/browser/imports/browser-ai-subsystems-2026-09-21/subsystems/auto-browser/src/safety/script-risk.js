/**
 * Plain-language risk summary for an `evaluate_script` body, shown in the
 * approval prompt.
 *
 * THIS IS NOT A SECURITY BOUNDARY. Every signal below is trivially hidden
 * behind dynamic construction — `window["fe" + "tch"]`, bracket access on a
 * computed key, a string assembled at runtime — so a "clean" result NEVER
 * means the script is safe, and nothing here may gate execution. It exists for
 * one reason: a wall of minified JavaScript in a narrow panel gives a
 * non-programmer nothing to decide on, and a short "this script sends data to
 * the network" gives them something. Honest scripts describe themselves
 * honestly; that covers the common case, which is the case worth improving.
 *
 * Keep it that way. If a future change starts *allowing* based on these flags,
 * it has turned a readability aid into a bypassable authorization check.
 */

// Ordered most- to least-alarming so the summary leads with the worst.
const SIGNALS = [
  {
    key: "network",
    // `fetch(`, XHR, beacons, sockets — anything that can move data off-page.
    re: /\bfetch\s*\(|\bXMLHttpRequest\b|sendBeacon\s*\(|\bWebSocket\b|\bEventSource\b|\$\.(?:ajax|post|get)\s*\(/,
    text: "sends or receives network requests",
  },
  {
    key: "credentials",
    re: /document\s*\.\s*cookie|localStorage|sessionStorage|indexedDB|\bcaches\b/,
    text: "reads or writes stored site data (cookies, local storage)",
  },
  {
    key: "navigation",
    re: /location\s*\.\s*(?:href|assign|replace)|location\s*=|window\s*\.\s*open\s*\(|history\s*\.\s*(?:pushState|replaceState)/,
    text: "navigates the page or opens a window",
  },
  {
    key: "mutation",
    re: /\.\s*click\s*\(|\.\s*submit\s*\(|requestSubmit\s*\(|innerHTML\s*=|\.\s*value\s*=|dispatchEvent\s*\(/,
    text: "clicks, types, or submits on the page",
  },
];

// The extension's own WebMCP bridge — a script that only drives page-declared
// tools is the benign, intended shape for the algorithmic-loop case.
const WEBMCP_HANDLE_RE = /__autobrowser_webmcp_shim_v1_handle/;

/**
 * @param {string} expression Script body.
 * @returns {{ flags: string[], phrases: string[], usesPageTools: boolean,
 *             summary: string }}
 *   `summary` is a single sentence ready to drop into the approval prompt.
 */
export function summarizeScriptRisk(expression) {
  const src = typeof expression === "string" ? expression : "";
  const hits = SIGNALS.filter((s) => s.re.test(src));
  const usesPageTools = WEBMCP_HANDLE_RE.test(src);
  const flags = hits.map((h) => h.key);
  const phrases = hits.map((h) => h.text);

  let summary;
  if (phrases.length === 0) {
    summary = usesPageTools
      ? "Calls this page's own declared tools. No network, storage, or navigation calls detected."
      : "No network, storage, or navigation calls detected.";
  } else {
    summary = `${capitalize(phrases[0])}${phrases.length > 1 ? "; also " + phrases.slice(1).join("; ") : ""}.`;
    if (usesPageTools) summary += " Also calls this page's own declared tools.";
  }
  // Never let the summary read as an all-clear.
  summary += " Detection is best-effort — a script can hide these.";

  return { flags, phrases, usesPageTools, summary };
}

function capitalize(s) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
