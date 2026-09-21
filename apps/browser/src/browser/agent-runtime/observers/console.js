/**
 * Console observer. Two CDP event sources feed the same buffer:
 *
 *   Runtime.consoleAPICalled  — page JS calling console.log/info/warn/error.
 *                                Tagged source="console".
 *   Log.entryAdded            — Chrome itself reporting network errors,
 *                                deprecation warnings, security violations.
 *                                The CDP entry already has a `source` field
 *                                (network, security, javascript, …) which we
 *                                surface verbatim.
 *
 * Argument serialisation: Runtime.consoleAPICalled gives us a `RemoteObject`
 * per arg. We only have access to the metadata — `value` for primitives,
 * `description` for callable/objects. The fallback `[object Foo]` /
 * `[function (...) => ...]` markers are stable enough that the agent's
 * renderer doesn't crash and the agent itself can still reason about the
 * shape, even when the actual value is unrepresentable across the wire.
 */
import { RingBuffer } from "../cdp/events.js";

function serializeArg(arg) {
  if (!arg) return "";
  if ("value" in arg && (arg.type === "string" || arg.type === "number" || arg.type === "boolean")) {
    return arg.value;
  }
  if (arg.type === "function") {
    return `[function ${arg.description || ""}]`.trim().replace(/\s+\]$/, "]");
  }
  if (arg.type === "object") {
    return `[object ${arg.className || "Object"}]`;
  }
  if (arg.type === "undefined") return "undefined";
  if (arg.value !== undefined) return String(arg.value);
  if (arg.description) return arg.description;
  return `[${arg.type}]`;
}

export function createConsoleObserver(driver, tabId, { capacity = 200 } = {}) {
  const buffer = new RingBuffer(capacity);

  const offConsole = driver.onForTab(tabId, "Runtime.consoleAPICalled", (params) => {
    buffer.push({
      source: "console",
      level: params.type,
      args: (params.args || []).map(serializeArg),
      timestamp: params.timestamp,
      ...(params.stackTrace ? { stackTrace: params.stackTrace } : {}),
    });
  });

  const offLog = driver.onForTab(tabId, "Log.entryAdded", (params) => {
    const entry = params?.entry || {};
    buffer.push({
      source: entry.source || "log",
      level: entry.level,
      text: entry.text,
      ...(entry.url ? { url: entry.url } : {}),
      timestamp: entry.timestamp,
    });
  });

  async function attach() {
    await driver.send(tabId, "Runtime.enable", {});
    await driver.send(tabId, "Log.enable", {});
  }

  function detach() {
    offConsole();
    offLog();
  }

  return {
    attach,
    detach,
    list: (opts) => buffer.list(opts),
    get: (id) => buffer.get(id),
  };
}
