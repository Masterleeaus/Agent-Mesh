/**
 * JavaScript dialog handling — alert / confirm / prompt / beforeunload.
 *
 * The agent calls handle_dialog when it expects a dialog to be open (typically
 * after a click or navigate it knows triggers a confirm). The CDP call returns
 * an error if no dialog is showing; we translate that into an instructional
 * message so the agent can re-orient (usually: trigger the dialog first, then
 * call this).
 *
 * accept must be an explicit boolean — there is no implicit default. The
 * agent has to commit to "yes" or "no" because dialog flows have meaningful
 * branches and we never want to accidentally accept (or dismiss) on the
 * agent's behalf.
 */

const NO_DIALOG_HINT = "Trigger the dialog first (e.g. click the button that opens it), then call handle_dialog.";

export async function handleDialog(driver, tabId, params = {}) {
  if (typeof params.accept !== "boolean") {
    return {
      error: "handle_dialog: 'accept' must be an explicit boolean (true to accept, false to dismiss).",
    };
  }
  const cdpParams = { accept: params.accept };
  // promptText only matters when accepting a window.prompt(). Sending it on
  // dismiss is harmless for Chrome but a misleading thing to log/surface.
  if (params.accept && typeof params.promptText === "string") {
    cdpParams.promptText = params.promptText;
  }
  try {
    await driver.send(tabId, "Page.handleJavaScriptDialog", cdpParams);
    return { ok: true };
  } catch (err) {
    const msg = err.message || "";
    if (/no dialog/i.test(msg)) {
      return { error: `handle_dialog: ${msg}. ${NO_DIALOG_HINT}` };
    }
    return { error: msg };
  }
}
