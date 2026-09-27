/**
 * Arbitrary JavaScript evaluation in the page's main world via CDP
 * Runtime.evaluate.
 *
 * This is the most powerful tool the agent can call: any code passed here
 * runs with full page authority (cookies, localStorage, fetch). The
 * always-ask gate in permission-manager.js makes evaluate_script the only
 * tool that NEVER auto-allows — every call surfaces a confirmation modal
 * with the exact code preview, regardless of mode or grants.
 *
 * Defaults:
 *   - awaitPromise: true   so `await fetch(...)` style expressions resolve
 *     before the call returns, and the agent gets the value rather than a
 *     pending Promise marker.
 *   - returnByValue: true  so the result comes back JSON-serialised instead
 *     of as a remote object handle the agent can't dereference.
 *   - timeout: 15000 ms    a hung script (infinite loop, awaiting a never-
 *     settled promise) can't pin the agent indefinitely.
 *
 * On a CDP exception the result includes line/column from exceptionDetails so
 * the agent can correlate the error to the source it submitted.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

function expressionError() {
  return { error: "evaluate_script: 'expression' is required (non-empty string)." };
}

function pickExceptionMessage(details) {
  if (!details) return "evaluate_script: unknown exception.";
  // Prefer the rich `exception.description` (full stack); fall back to the
  // bare `text` line that CDP attaches to the entry.
  return (
    details.exception?.description ||
    details.text ||
    "evaluate_script: unknown exception."
  );
}

export async function evaluateScript(driver, tabId, params = {}) {
  const expression = typeof params.expression === "string" ? params.expression.trim() : "";
  if (!expression) return expressionError();

  const cdpParams = {
    expression,
    awaitPromise: params.await_promise === false ? false : true,
    returnByValue: true,
    timeout: Number.isFinite(params.timeout_ms) && params.timeout_ms > 0
      ? params.timeout_ms
      : DEFAULT_TIMEOUT_MS,
  };

  try {
    const res = await driver.send(tabId, "Runtime.evaluate", cdpParams);
    if (res?.exceptionDetails) {
      return {
        error: pickExceptionMessage(res.exceptionDetails),
        line: res.exceptionDetails.lineNumber,
        column: res.exceptionDetails.columnNumber,
      };
    }
    const result = res?.result || {};
    return { ok: true, type: result.type, value: result.value };
  } catch (err) {
    return { error: err.message };
  }
}
