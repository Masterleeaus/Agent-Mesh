/**
 * Origin-level URL-drift check. Called by the action dispatcher before every
 * mutating CDP call: if the tab's current origin no longer matches the origin
 * we captured at the last snapshot, we abort with an instructional error.
 *
 * Origin, not path — SPAs route internally without changing origin, and we
 * don't want to re-prompt for every in-app navigation. A genuine cross-origin
 * drift (redirect, popup, navigation away) is the threat model.
 */

export function originOf(url) {
  if (url == null) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Fail-closed: if either URL is unparseable, treat as drift.
 */
export function hasDrifted(expectedUrl, actualUrl) {
  const e = originOf(expectedUrl);
  const a = originOf(actualUrl);
  if (e === null || a === null) return true;
  return e !== a;
}

/**
 * Structured error shape the dispatcher returns to the LLM when drift is
 * detected. The `error` string is also the recovery instruction — calling
 * take_snapshot re-establishes the session origin.
 */
export function driftError(expectedUrl, actualUrl) {
  const expected = originOf(expectedUrl) ?? expectedUrl;
  const actual = originOf(actualUrl) ?? actualUrl;
  return {
    drifted: true,
    expected,
    actual,
    error: `URL drifted from ${expected} to ${actual}. Re-orient with take_snapshot.`,
  };
}
