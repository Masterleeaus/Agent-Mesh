const DIRECTION_ALIASES = new Map([
  ["n", "north"],
  ["north", "north"],
  ["s", "south"],
  ["south", "south"],
  ["e", "east"],
  ["east", "east"],
  ["w", "west"],
  ["west", "west"],
  ["u", "up"],
  ["up", "up"],
  ["d", "down"],
  ["down", "down"],
  ["left", "left"],
  ["right", "right"],
]);

const OPPOSITE_DIRECTION = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const OPEN_DIRECTION_KEYS = [
  "availableDirections",
  "available_moves",
  "availableMoves",
  "openDirections",
  "open_moves",
  "openMoves",
  "exits",
  "directions",
  "paths",
  "neighbors",
];

const BLOCKED_DIRECTION_KEYS = [
  "blockedDirections",
  "blocked_moves",
  "blockedMoves",
  "walls",
  "blocked",
  "closedDirections",
  "closed_moves",
  "closedMoves",
];

const GENERIC_STATE_KEYS = [
  "location",
  "room",
  "roomId",
  "cell",
  "tile",
  "name",
  "title",
  "status",
  "phase",
  "mode",
  "screen",
  "scene",
  "step",
  "stage",
  "page",
  "dialog",
  "modal",
  "route",
  "view",
  "tab",
  "selection",
  "selected",
  "current",
  "activeTab",
];

const STATE_LABEL_PRIORITY = [
  "location",
  "room",
  "name",
  "title",
  "screen",
  "scene",
  "page",
  "dialog",
  "modal",
  "phase",
  "status",
  "step",
  "mode",
  "view",
];

const ITEM_KEYS = ["holding", "inventory", "inventories", "item", "items", "key", "keys"];
const RESULT_SUMMARY_KEYS = ["error", "message", "text", "status", "phase", "title", "name", "selected", "value"];
const STATE_CONTAINER_KEYS = ["state", "currentState", "current_state", "context"];
const RECENT_ACTION_LIMIT = 16;
const CONCERN_LIMIT = 4;
const OSCILLATION_LIMIT = 4;
const BRANCH_LIMIT = 64;
const BRANCH_DISPLAY_LIMIT = 3;
const CONCERN_DISPLAY_LIMIT = 2;
const PENDING_MOVE_STEP_TTL = 2;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isUnexploredExit(exit) {
  return Boolean(exit) && exit.status === "open" && !exit.targetKey;
}

export function lastCameFromKey(nav) {
  return nav?.lastSuccessfulMove?.fromKey || null;
}

function isBlobLike(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input || "");
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeDirection(value) {
  if (typeof value !== "string") return null;
  return DIRECTION_ALIASES.get(value.trim().toLowerCase()) || null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toShortText(value, max = 80) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function isMeaningfulScalar(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function canonicalize(value, depth = 2) {
  if (value == null) return value;
  if (typeof value === "string") return toShortText(value, 120);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (isBlobLike(value)) {
    return `[Blob ${value.type || "application/octet-stream"} ${value.size || 0}]`;
  }
  if (Array.isArray(value)) {
    if (depth <= 0) return `[array:${value.length}]`;
    return value.slice(0, 6).map((entry) => canonicalize(entry, depth - 1));
  }
  if (isPlainObject(value)) {
    if (depth <= 0) return "[object]";
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (key.startsWith("__")) continue;
      out[key] = canonicalize(value[key], depth - 1);
    }
    return out;
  }
  return String(value);
}

function stableSerialize(value, depth = 2) {
  return JSON.stringify(canonicalize(value, depth));
}

function isErrorLikeText(text) {
  return /\b(error|failed|invalid|required|denied|cannot|can't|blocked|wall)\b/i.test(text || "");
}

function directionListFromString(value) {
  if (typeof value !== "string") return [];
  return unique(
    value
      .split(/[\s,|/]+/)
      .map(normalizeDirection),
  );
}

function parseDirectionsFromDescription(value) {
  if (typeof value !== "string") return [];
  const lower = value.toLowerCase();
  const exitsMatch = lower.match(/\bexits?\b\s*[:=-]?\s*([a-z,\s/|]+)/i);
  if (exitsMatch?.[1]) {
    return directionListFromString(exitsMatch[1]);
  }
  const canGoMatch = lower.match(
    /\b(?:can go|available directions?|open paths?|open exits?)\b[^a-z0-9]*([a-z,\s/|]+)/i,
  );
  if (canGoMatch?.[1]) {
    return directionListFromString(canGoMatch[1]);
  }
  return [];
}

function extractDirections(value, mode = "open") {
  if (!value) return [];
  if (Array.isArray(value)) {
    return unique(
      value.flatMap((entry) => extractDirections(entry, mode)),
    );
  }
  if (typeof value === "string") {
    return directionListFromString(value);
  }
  if (!isPlainObject(value)) return [];

  const directions = [];
  for (const [key, raw] of Object.entries(value)) {
    const dir = normalizeDirection(key);
    if (dir) {
      if (mode === "open") {
        if (
          raw === true ||
          raw === 1 ||
          (typeof raw === "string" && /^(open|available|true|yes|clear)$/i.test(raw))
        ) {
          directions.push(dir);
        }
      } else if (
        raw === false ||
        raw === 0 ||
        (typeof raw === "string" && /^(blocked|closed|wall|false|no)$/i.test(raw))
      ) {
        directions.push(dir);
      }
      continue;
    }

    if (Array.isArray(raw) || typeof raw === "string" || isPlainObject(raw)) {
      directions.push(...extractDirections(raw, mode));
    }
  }
  return unique(directions);
}

function extractDirectionalFlags(value, mode) {
  if (!isPlainObject(value)) return [];
  const directions = [];
  for (const [key, raw] of Object.entries(value)) {
    const dir = normalizeDirection(key);
    if (!dir) continue;
    if (mode === "open") {
      if (
        raw === true ||
        raw === 1 ||
        (typeof raw === "string" && /^(open|available|true|yes|clear)$/i.test(raw))
      ) {
        directions.push(dir);
      }
    } else if (
      raw === false ||
      raw === 0 ||
      (typeof raw === "string" && /^(blocked|closed|wall|false|no)$/i.test(raw))
    ) {
      directions.push(dir);
    }
  }
  return unique(directions);
}

function createDirectionSignal(structured, text) {
  const structuredDirections = unique(structured);
  const textDirections = unique(text);
  return {
    directions: unique([...structuredDirections, ...textDirections]),
    structured: structuredDirections,
    text: textDirections,
  };
}

function extractOpenSignal(result) {
  const structured = [];
  const text = [];
  if (isPlainObject(result)) {
    for (const key of OPEN_DIRECTION_KEYS) {
      if (key in result) structured.push(...extractDirections(result[key], "open"));
    }
    structured.push(...extractDirectionalFlags(result, "open"));
    for (const key of ["description", "text", "summary", "message"]) {
      if (typeof result[key] === "string") {
        text.push(...parseDirectionsFromDescription(result[key]));
      }
    }
  } else if (typeof result === "string" && !isErrorLikeText(result)) {
    text.push(...parseDirectionsFromDescription(result));
  }
  return createDirectionSignal(structured, text);
}

function extractBlockedSignal(result) {
  const structured = [];
  const text = [];
  if (isPlainObject(result)) {
    for (const key of BLOCKED_DIRECTION_KEYS) {
      if (key in result) structured.push(...extractDirections(result[key], "blocked"));
    }
    structured.push(...extractDirectionalFlags(result, "blocked"));
    for (const key of ["description", "text", "summary", "message", "error"]) {
      const value = result[key];
      if (typeof value !== "string") continue;
      if (/\b(blocked|wall|cannot|can't|closed)\b/i.test(value)) {
        const mentioned = value.match(/\b(north|south|east|west|up|down|left|right)\b/gi) || [];
        text.push(...mentioned.map(normalizeDirection));
      }
    }
  } else if (typeof result === "string" && /\b(blocked|wall|cannot|can't|closed)\b/i.test(result)) {
    const mentioned = result.match(/\b(north|south|east|west|up|down|left|right)\b/gi) || [];
    text.push(...mentioned.map(normalizeDirection));
  }
  return createDirectionSignal(structured, text);
}

function explicitStateKey(result) {
  if (!isPlainObject(result)) return null;
  if (Number.isFinite(result.x) && Number.isFinite(result.y)) {
    return `coord:${result.x},${result.y}`;
  }
  if (isPlainObject(result.position)) {
    if (Number.isFinite(result.position.x) && Number.isFinite(result.position.y)) {
      return `coord:${result.position.x},${result.position.y}`;
    }
    if (typeof result.position.id === "string" || typeof result.position.name === "string") {
      return `position:${String(result.position.id || result.position.name).trim().toLowerCase()}`;
    }
  }
  if (isPlainObject(result.coordinates)) {
    if (Number.isFinite(result.coordinates.x) && Number.isFinite(result.coordinates.y)) {
      return `coord:${result.coordinates.x},${result.coordinates.y}`;
    }
  }
  for (const key of ["location", "roomId", "room", "cell", "tile", "id"]) {
    const value = result[key];
    if (typeof value === "string" || typeof value === "number") {
      return `${key}:${String(value).trim().toLowerCase()}`;
    }
  }
  return null;
}

/**
 * Phase 3 — environment fingerprint fallback. Passed in from the caller
 * (src/content.js reactLoop) as `{ key, summary }` from
 * src/llm/state-fingerprint.js. Used only when positional state-key
 * derivation returns null — the positional path stays primary so WebMCP
 * games (mazes, puzzles) keep their coordinate-based observations.
 *
 * When present, the env fingerprint seeds the observation so stuck-CDP
 * submits on generic web pages (same URL + same a11y tree after a click)
 * get a stable state key and the no-progress / repeated-error detectors
 * actually fire.
 */
function environmentStateKey(environment) {
  if (!environment || typeof environment !== "object") return null;
  if (typeof environment.key !== "string" || !environment.key) return null;
  return environment.key;
}

function mergeStateFields(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (!target[key] && value) target[key] = value;
  }
}

function extractStateFields(result) {
  const fields = {};
  if (!isPlainObject(result)) return fields;

  if (Number.isFinite(result.x) && Number.isFinite(result.y)) {
    fields.coordinates = `(${result.x}, ${result.y})`;
  }
  if (isPlainObject(result.position)) {
    if (Number.isFinite(result.position.x) && Number.isFinite(result.position.y)) {
      fields.coordinates = `(${result.position.x}, ${result.position.y})`;
    }
    if (typeof result.position.name === "string" || typeof result.position.id === "string") {
      fields.position = toShortText(result.position.name || result.position.id);
    }
  }
  if (isPlainObject(result.coordinates)) {
    if (Number.isFinite(result.coordinates.x) && Number.isFinite(result.coordinates.y)) {
      fields.coordinates = `(${result.coordinates.x}, ${result.coordinates.y})`;
    }
  }

  for (const key of GENERIC_STATE_KEYS) {
    if (isMeaningfulScalar(result[key])) {
      fields[key] = toShortText(result[key]);
    }
  }

  for (const key of STATE_CONTAINER_KEYS) {
    if (!isPlainObject(result[key])) continue;
    for (const nestedKey of GENERIC_STATE_KEYS) {
      if (!fields[nestedKey] && isMeaningfulScalar(result[key][nestedKey])) {
        fields[nestedKey] = toShortText(result[key][nestedKey]);
      }
    }
  }

  return fields;
}

function pickObservationLabel(fields) {
  for (const key of STATE_LABEL_PRIORITY) {
    if (fields[key]) return { label: fields[key], labelKey: key };
  }
  const [firstKey, firstValue] = Object.entries(fields)[0] || [];
  return { label: firstValue || "", labelKey: firstKey || "" };
}

function extractStateLabel(result, fields = null) {
  if (!isPlainObject(result)) {
    return typeof result === "string" && !isErrorLikeText(result)
      ? { label: toShortText(result), labelKey: "text" }
      : { label: "", labelKey: "" };
  }
  return pickObservationLabel(fields || extractStateFields(result));
}

function extractItems(result, toolName, args) {
  const found = [];
  if (isPlainObject(result)) {
    for (const key of ITEM_KEYS) {
      const value = result[key];
      if (typeof value === "string") {
        found.push(toShortText(value));
      } else if (Array.isArray(value)) {
        found.push(...value.filter((entry) => typeof entry === "string").map((entry) => toShortText(entry)));
      }
    }
  }
  return unique(found);
}

function deriveStateObservation(result, toolName, args, environment = null) {
  const fields = extractStateFields(result);
  const openSignal = extractOpenSignal(result);
  const blockedSignal = extractBlockedSignal(result);
  const open = openSignal.directions;
  const blocked = blockedSignal.directions;
  const items = extractItems(result, toolName, args);
  const { label, labelKey } = extractStateLabel(result, fields);
  const keyPayload = {};
  if (Object.keys(fields).length) keyPayload.fields = fields;
  if (open.length) keyPayload.open = open;
  if (blocked.length) keyPayload.blocked = blocked;

  // Positional / result-content key (primary). Falls back to env fingerprint
  // only when nothing in the tool's own result identifies a state — e.g.
  // generic web pages where click() returns {ok:true} with no observation.
  const key =
    explicitStateKey(result) ||
    (Object.keys(keyPayload).length
      ? `state:${hashString(stableSerialize(keyPayload, 3))}`
      : label
        ? `state:${hashString(label.toLowerCase())}`
        : environmentStateKey(environment));

  if (!key) return null;
  // Synthesize a label + fields when we fell back to the env fingerprint so
  // formatWorkingMemoryForPrompt / advisories still have a readable anchor.
  // Positional/result-path observations already have their own label.
  const envSummary = environment && typeof environment === "object" ? environment.summary : null;
  const synthLabel = !label && key === environmentStateKey(environment) && envSummary
    ? envSummary.pathname || envSummary.url || key.replace(/^env:/, "")
    : label;
  const synthLabelKey = !labelKey && key === environmentStateKey(environment) ? "page" : labelKey;
  const mergedFields = { ...fields };
  if (!Object.keys(mergedFields).length && envSummary) {
    if (envSummary.url) mergedFields.url = envSummary.url;
    if (envSummary.pathname) mergedFields.pathname = envSummary.pathname;
    if (typeof envSummary.toolCount === "number" && envSummary.toolCount > 0) {
      mergedFields.tools = `${envSummary.toolCount} WebMCP`;
    }
  }
  return {
    key,
    label: synthLabel || key.replace(/^state:/, "").replace(/^env:/, ""),
    labelKey: synthLabelKey,
    fields: mergedFields,
    open,
    openStructured: openSignal.structured,
    openText: openSignal.text,
    blocked,
    blockedStructured: blockedSignal.structured,
    blockedText: blockedSignal.text,
    items,
  };
}

function isMoveTool(toolName, args) {
  return toolName === "move" || normalizeDirection(args?.direction) !== null;
}

function isLookTool(toolName) {
  return toolName === "look";
}

function isSuccessfulResult(result, isError) {
  if (isError) return false;
  if (isPlainObject(result) && typeof result.error === "string") return false;
  if (isPlainObject(result) && "success" in result) return Boolean(result.success);
  if (isPlainObject(result) && "ok" in result) return Boolean(result.ok);
  if (typeof result === "string") {
    return !/\b(error|blocked|cannot|can't|failed|wall)\b/i.test(result);
  }
  return true;
}

function currentObservation(state) {
  const key = state.currentObservationKey;
  return key ? state.observations.get(key) || null : null;
}

function preferLabel(existing, candidate) {
  if (!candidate) return existing;
  if (!existing) return candidate;
  return candidate.length < existing.length ? candidate : existing;
}

function ensureObservation(state, observation) {
  let stored = state.observations.get(observation.key);
  if (!stored) {
    stored = {
      key: observation.key,
      label: observation.label,
      labelKey: observation.labelKey,
      fields: {},
      items: [],
      visits: 0,
    };
    state.observations.set(observation.key, stored);
  }
  stored.label = preferLabel(stored.label, observation.label);
  stored.labelKey = stored.labelKey || observation.labelKey;
  mergeStateFields(stored.fields, observation.fields || {});
  if (observation.items?.length) {
    stored.items = unique([...stored.items, ...observation.items]);
  }
  return stored;
}

function setCurrentObservation(state, observation) {
  const stored = ensureObservation(state, observation);
  if (state.currentObservationKey !== stored.key) {
    stored.visits += 1;
  } else if (stored.visits === 0) {
    stored.visits = 1;
  }
  state.currentObservationKey = stored.key;
  return stored;
}

function ensureState(nav, observation) {
  let state = nav.states.get(observation.key);
  if (!state) {
    state = {
      key: observation.key,
      label: observation.label,
      visits: 0,
      exits: {},
      items: [],
    };
    nav.states.set(observation.key, state);
  }
  state.label = preferLabel(state.label, observation.label);
  if (observation.items.length) {
    state.items = unique([...state.items, ...observation.items]);
  }
  const openSet = new Set(observation.open);
  const blockedSet = new Set(observation.blocked);
  const openStructuredSet = new Set(observation.openStructured || []);
  const blockedStructuredSet = new Set(observation.blockedStructured || []);
  const directions = unique([...observation.open, ...observation.blocked]);

  for (const dir of directions) {
    const isOpen = openSet.has(dir);
    const isBlocked = blockedSet.has(dir);
    let status = null;

    if (isOpen && isBlocked) {
      const openStructured = openStructuredSet.has(dir);
      const blockedStructured = blockedStructuredSet.has(dir);
      if (openStructured && !blockedStructured) {
        status = "open";
      } else if (blockedStructured && !openStructured) {
        status = "blocked";
      } else {
        continue;
      }
    } else if (isOpen) {
      status = "open";
    } else if (isBlocked) {
      status = "blocked";
    }

    if (status) {
      state.exits[dir] = { ...(state.exits[dir] || {}), status };
    }
  }
  return state;
}

function setCurrentState(nav, stateKey, viaDirection = null) {
  if (!stateKey) return;
  const state = nav.states.get(stateKey);
  if (!state) return;
  if (nav.currentStateKey === stateKey) return;

  state.visits += 1;
  state.lastVisitSeq = ++nav.visitSeq;

  if (nav.path.length === 0) {
    nav.path.push({ key: stateKey, via: null });
  } else if (
    nav.path.length >= 2 &&
    nav.path[nav.path.length - 2].key === stateKey
  ) {
    nav.path.pop();
  } else if (nav.path[nav.path.length - 1].key !== stateKey) {
    nav.path.push({ key: stateKey, via: viaDirection });
  }

  nav.currentStateKey = stateKey;
}

function linkStates(nav, fromKey, direction, toKey) {
  if (!fromKey || !direction || !toKey) return;
  const from = nav.states.get(fromKey);
  const to = nav.states.get(toKey);
  if (!from || !to) return;

  const existingForward = from.exits[direction] || {};
  if (existingForward.targetKey && existingForward.targetKey !== toKey) {
    const { targetKey: _ignoredTargetKey, ...rest } = existingForward;
    // Conflicting destinations mean the edge is not deterministic enough for
    // "known return" advice; keep it open but stop claiming a concrete target.
    from.exits[direction] = { ...rest, status: "open" };
  } else {
    from.exits[direction] = {
      ...existingForward,
      status: "open",
      targetKey: toKey,
    };
  }

  const opposite = OPPOSITE_DIRECTION[direction];
  if (opposite) {
    const existingReverse = to.exits[opposite];
    if (!existingReverse || existingReverse.status !== "blocked") {
      if (existingReverse?.targetKey && existingReverse.targetKey !== fromKey) {
        const { targetKey: _ignoredTargetKey, ...rest } = existingReverse;
        to.exits[opposite] = { ...rest, status: "open" };
      } else {
        to.exits[opposite] = {
          ...(existingReverse || {}),
          status: "open",
          targetKey: fromKey,
        };
      }
    }
  }
}

function currentNavigationState(state) {
  const key = state.navigation.currentStateKey;
  return key ? state.navigation.states.get(key) || null : null;
}

function recordOscillation(nav, fromKey, direction, toKey) {
  const previous = nav.lastSuccessfulMove;
  if (!previous) return;
  const opposite = OPPOSITE_DIRECTION[direction];
  if (
    previous.direction === opposite &&
    previous.fromKey === toKey &&
    previous.toKey === fromKey
  ) {
    const fromLabel = nav.states.get(fromKey)?.label || "current state";
    const toLabel = nav.states.get(toKey)?.label || "previous state";
    nav.oscillations.push(
      `The last successful move ${opposite} was immediately reversed with ${direction} (${fromLabel} <-> ${toLabel}).`,
    );
    if (nav.oscillations.length > OSCILLATION_LIMIT) nav.oscillations.shift();
  }
}

function formatActionLabel(toolName, argsSummary) {
  return argsSummary && argsSummary !== "{}"
    ? `${toolName} ${argsSummary}`
    : toolName;
}

function summarizeGoal(text) {
  const clean = toShortText(text, 160);
  if (!clean) return "";
  return clean.replace(/\s+/g, " ");
}

function summarizeResult(result, isError) {
  if (isPlainObject(result)) {
    for (const key of RESULT_SUMMARY_KEYS) {
      if (isMeaningfulScalar(result[key])) {
        return toShortText(result[key], 120);
      }
    }
  }
  if (typeof result === "string") {
    return toShortText(result, 120);
  }
  if (result == null) {
    return isError ? "error" : "ok";
  }
  return toShortText(stableSerialize(result, 1), 120);
}

function recentMatchingActions(state, toolName, argsKey, beforeStateKey) {
  return state.actions.recent.filter(
    (entry) =>
      entry.toolName === toolName &&
      entry.argsKey === argsKey &&
      entry.beforeStateKey === beforeStateKey,
  );
}

function pushConcern(state, text) {
  if (!text) return;
  const concerns = state.actions.concerns;
  if (concerns[concerns.length - 1] === text) return;
  concerns.push(text);
  if (concerns.length > CONCERN_LIMIT) concerns.shift();
}

function pruneBranches(state, preserveKey = null) {
  if (state.actions.branches.size <= BRANCH_LIMIT) return;

  let oldestKey = null;
  let oldestSeq = Infinity;
  for (const [key, branch] of state.actions.branches) {
    if (key === preserveKey) continue;
    if (branch.updatedSeq < oldestSeq) {
      oldestSeq = branch.updatedSeq;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    state.actions.branches.delete(oldestKey);
  }
}

function hasFreshPendingMove(state, pendingMove, beforeObservation) {
  if (!pendingMove?.fromKey || !pendingMove.direction) return false;
  if (pendingMove.seq < state.sequence - PENDING_MOVE_STEP_TTL) return false;
  if (beforeObservation?.key && beforeObservation.key !== pendingMove.fromKey) return false;
  return true;
}

function ensureBranch(state, toolName, argsSummary, beforeObservation) {
  const branchKey = `${beforeObservation?.key || "global"}:${toolName}:${argsSummary}`;
  let branch = state.actions.branches.get(branchKey);
  if (!branch) {
    branch = {
      key: branchKey,
      toolName,
      argsSummary,
      label: formatActionLabel(toolName, argsSummary),
      stateKey: beforeObservation?.key || null,
      stateLabel: beforeObservation?.label || "",
      attempts: 0,
      status: "new",
      lastResultSummary: "",
      updatedSeq: 0,
    };
    state.actions.branches.set(branchKey, branch);
  }
  return branch;
}

function recordActionAttempt(state, toolName, args, result, isError, beforeObservation, afterObservation) {
  const argsSummary = stableSerialize(args, 1);
  const argsKey = hashString(stableSerialize(args, 2));
  const beforeStateKey = beforeObservation?.key || null;
  const afterStateKey = afterObservation?.key || null;
  const resultKey = `${isError ? "error" : "result"}:${hashString(stableSerialize(result, 2))}`;
  const resultSummary = summarizeResult(result, isError);
  const previousMatch = recentMatchingActions(state, toolName, argsKey, beforeStateKey).slice(-1)[0] || null;

  let progress = "unknown";
  let repeatCount = 1;

  if (beforeStateKey && afterStateKey && beforeStateKey !== afterStateKey) {
    progress = "state_changed";
  } else if (!beforeStateKey && afterStateKey) {
    progress = "state_discovered";
  } else if (isError) {
    if (previousMatch && previousMatch.resultKey === resultKey) {
      progress = "repeated_error";
      repeatCount = (previousMatch.repeatCount || 1) + 1;
    } else {
      progress = "error";
    }
  } else if (beforeStateKey && afterStateKey && beforeStateKey === afterStateKey) {
    if (
      previousMatch &&
      previousMatch.resultKey === resultKey &&
      previousMatch.afterStateKey === afterStateKey
    ) {
      progress = "no_progress";
      repeatCount = (previousMatch.repeatCount || 1) + 1;
    } else {
      progress = "same_state";
    }
  } else if (previousMatch && previousMatch.resultKey === resultKey) {
    progress = "repeat_result";
    repeatCount = (previousMatch.repeatCount || 1) + 1;
  }

  const entry = {
    seq: ++state.sequence,
    toolName,
    argsKey,
    argsSummary,
    beforeStateKey,
    beforeStateLabel: beforeObservation?.label || "",
    afterStateKey,
    afterStateLabel: afterObservation?.label || "",
    outcome: isError ? "error" : "success",
    progress,
    repeatCount,
    resultKey,
    resultSummary,
  };

  state.actions.recent.push(entry);
  if (state.actions.recent.length > RECENT_ACTION_LIMIT) state.actions.recent.shift();

  const branch = ensureBranch(state, toolName, argsSummary, beforeObservation);
  branch.attempts += 1;
  branch.lastResultSummary = resultSummary;
  branch.updatedSeq = entry.seq;
  pruneBranches(state, branch.key);
  if (progress === "state_changed" || progress === "state_discovered") {
    branch.status = "progress";
  } else if (progress === "repeated_error" || progress === "error") {
    branch.status = "stalled";
  } else if (progress === "no_progress") {
    branch.status = "stalled";
  } else {
    branch.status = "attempted";
  }

  if (progress === "repeated_error" && repeatCount >= 2 && beforeObservation) {
    pushConcern(
      state,
      `${formatActionLabel(toolName, argsSummary)} already failed ${repeatCount} times in ${beforeObservation.label} with the same result: ${resultSummary}.`,
    );
  } else if (progress === "no_progress" && repeatCount >= 2 && beforeObservation) {
    pushConcern(
      state,
      `${formatActionLabel(toolName, argsSummary)} already ran ${repeatCount} times in ${beforeObservation.label} with no visible progress${resultSummary ? ` (${resultSummary})` : ""}.`,
    );
  }
}

function describeObservation(observation) {
  if (!observation) return "";
  const extras = Object.entries(observation.fields || {})
    .filter(([key, value]) => value && key !== observation.labelKey && value !== observation.label)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${value}`);
  return extras.length ? `${observation.label} (${extras.join(", ")})` : observation.label;
}

export function buildFrontier(state, limit = 5) {
  const nav = state?.navigation;
  if (!nav || nav.states.size === 0) return [];

  const entries = [];
  for (const node of nav.states.values()) {
    const directions = Object.entries(node.exits)
      .filter(([, exit]) => isUnexploredExit(exit))
      .map(([dir]) => dir);
    if (directions.length === 0) continue;
    entries.push({
      stateKey: node.key,
      label: node.label || node.key,
      directions,
      lastVisitSeq: node.lastVisitSeq || 0,
      isCurrent: node.key === nav.currentStateKey,
    });
  }

  entries.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return b.lastVisitSeq - a.lastVisitSeq;
  });

  return entries.slice(0, limit).map(({ stateKey, label, directions }) => ({
    stateKey,
    label,
    directions,
  }));
}

function describeFrontier(state) {
  const frontier = buildFrontier(state);
  if (frontier.length === 0) return [];
  const currentKey = state.navigation.currentStateKey;
  const parts = frontier.map((entry) => {
    const anchor = entry.stateKey === currentKey ? "here" : entry.label;
    return `${anchor}: ${entry.directions.join(", ")}`;
  });
  return [`- Unexplored frontier: ${parts.join("; ")}`];
}

function describeNavigationState(state) {
  const current = currentNavigationState(state);
  if (!current) return [];

  const unexplored = [];
  const visited = [];
  const blocked = [];

  for (const [direction, exit] of Object.entries(current.exits)) {
    if (exit.status === "blocked") {
      blocked.push(direction);
    } else if (exit.targetKey) {
      const target = state.navigation.states.get(exit.targetKey);
      visited.push(`${direction} -> ${target?.label || exit.targetKey}`);
    } else if (isUnexploredExit(exit)) {
      unexplored.push(direction);
    }
  }

  const lines = [];
  if (unexplored.length) lines.push(`- Unexplored exits here: ${unexplored.join(", ")}`);
  if (visited.length) lines.push(`- Known returns from here: ${visited.join("; ")}`);
  if (blocked.length) lines.push(`- Blocked directions here: ${blocked.join(", ")}`);
  if (current.items.length) lines.push(`- Items seen here: ${current.items.join(", ")}`);
  return lines;
}

function describeBranches(state) {
  const current = currentObservation(state);
  if (!current) return [];

  const relevant = [...state.actions.branches.values()]
    .filter((branch) => branch.stateKey === current.key)
    .sort((a, b) => b.updatedSeq - a.updatedSeq)
    .slice(0, BRANCH_DISPLAY_LIMIT);

  if (relevant.length === 0) return [];

  const parts = relevant.map((branch) => {
    const status =
      branch.status === "stalled"
        ? "stalled"
        : branch.status === "progress"
          ? "made progress"
          : "tried";
    const detail = branch.lastResultSummary ? ` -> ${branch.lastResultSummary}` : "";
    return `${branch.label} (${status}, ${branch.attempts}x)${detail}`;
  });
  return [`- Tried approaches here: ${parts.join("; ")}`];
}

function genericActionAdvisory(state, toolName, args = {}) {
  const current = currentObservation(state);
  if (!current) return null;

  const argsKey = hashString(stableSerialize(args, 2));
  const matches = recentMatchingActions(state, toolName, argsKey, current.key);
  if (matches.length < 2) return null;

  const last = matches[matches.length - 1];
  if (!last) return null;

  if (last.progress === "repeated_error") {
    return `Working memory: ${formatActionLabel(toolName, last.argsSummary)} already failed ${last.repeatCount || 2} times in ${current.label} with the same result: ${last.resultSummary}. Try a different action or change the state first.`;
  }

  if (last.progress === "no_progress") {
    return `Working memory: ${formatActionLabel(toolName, last.argsSummary)} already ran ${last.repeatCount || 2} times in ${current.label} with no visible progress${last.resultSummary ? ` (${last.resultSummary})` : ""}. Gather new information or change the state before trying it again.`;
  }

  return null;
}

export function createWorkingMemory() {
  return {
    sequence: 0,
    goal: {
      raw: "",
      summary: "",
    },
    inventory: [],
    observations: new Map(),
    currentObservationKey: null,
    navigation: {
      enabled: false,
      states: new Map(),
      currentStateKey: null,
      path: [],
      pendingMove: null,
      lastSuccessfulMove: null,
      oscillations: [],
      visitSeq: 0,
    },
    actions: {
      recent: [],
      concerns: [],
      branches: new Map(),
    },
  };
}

export function setUserGoal(state, userInstruction = "") {
  if (!state?.goal) return;
  const summary = summarizeGoal(userInstruction);
  state.goal.raw = typeof userInstruction === "string" ? userInstruction : "";
  state.goal.summary = summary;
}

export function recordToolUse(state, toolName, args = {}, result, { isError = false, environment = null } = {}) {
  if (!state || !state.navigation || !state.actions) return;

  const beforeObservation = currentObservation(state);
  const nav = state.navigation;
  const direction = normalizeDirection(args?.direction);
  const moveTool = isMoveTool(toolName, args);
  const lookTool = isLookTool(toolName);
  const observation = deriveStateObservation(result, toolName, args, environment);

  if (moveTool || lookTool || observation?.open.length || observation?.blocked.length) {
    nav.enabled = true;
  }

  if (observation?.items?.length) {
    state.inventory = unique([...state.inventory, ...observation.items]);
  }

  let afterObservation = beforeObservation;

  if (lookTool && observation) {
    ensureState(nav, observation);
    afterObservation = setCurrentObservation(state, observation);
    if (nav.pendingMove && !hasFreshPendingMove(state, nav.pendingMove, beforeObservation)) {
      nav.pendingMove = null;
    }
    if (nav.pendingMove?.fromKey && nav.pendingMove.direction) {
      linkStates(nav, nav.pendingMove.fromKey, nav.pendingMove.direction, observation.key);
      setCurrentState(nav, observation.key, nav.pendingMove.direction);
      recordOscillation(nav, nav.pendingMove.fromKey, nav.pendingMove.direction, observation.key);
      nav.lastSuccessfulMove = {
        fromKey: nav.pendingMove.fromKey,
        direction: nav.pendingMove.direction,
        toKey: observation.key,
      };
      nav.pendingMove = null;
    } else {
      setCurrentState(nav, observation.key);
      const current = currentNavigationState(state);
      if (current && current.visits === 0) current.visits = 1;
    }
  } else if (moveTool) {
    const ok = isSuccessfulResult(result, isError);
    if (!ok) {
      if (nav.currentStateKey && direction) {
        const stateAtFailure = nav.states.get(nav.currentStateKey);
        if (stateAtFailure) {
          stateAtFailure.exits[direction] = {
            ...(stateAtFailure.exits[direction] || {}),
            status: "blocked",
          };
        }
      }
    } else if (observation) {
      ensureState(nav, observation);
      afterObservation = setCurrentObservation(state, observation);
      const fromKey = nav.currentStateKey;
      if (fromKey && direction) {
        linkStates(nav, fromKey, direction, observation.key);
      }
      setCurrentState(nav, observation.key, direction);
      if (fromKey && direction) {
        recordOscillation(nav, fromKey, direction, observation.key);
      }
      nav.lastSuccessfulMove = { fromKey, direction, toKey: observation.key };
      nav.pendingMove = null;
    } else {
      const fromKey = nav.currentStateKey;
      nav.pendingMove = fromKey && direction ? { fromKey, direction, seq: state.sequence + 1 } : null;
    }
  } else if (observation) {
    afterObservation = setCurrentObservation(state, observation);
    ensureState(nav, observation);
    if (!nav.currentStateKey && (observation.open.length || observation.blocked.length)) {
      setCurrentState(nav, observation.key);
      const current = currentNavigationState(state);
      if (current && current.visits === 0) current.visits = 1;
    }
  }

  recordActionAttempt(state, toolName, args, result, isError, beforeObservation, afterObservation);
}

export function formatWorkingMemoryForPrompt(state) {
  if (!state) return "";

  const current = currentObservation(state);
  const navigationLines = describeNavigationState(state);
  const branchLines = describeBranches(state);
  const concernLines = state.actions.concerns.slice(-CONCERN_DISPLAY_LIMIT).map((entry) => `- Recent dead end: ${entry}`);

  if (!state.goal?.summary && !current && navigationLines.length === 0 && branchLines.length === 0 && state.inventory.length === 0 && concernLines.length === 0) {
    return "";
  }

  const lines = ["Derived working memory from prior tool results:"];

  if (state.goal?.summary) {
    lines.push(`- Active objective: ${state.goal.summary}`);
  }

  lines.push(...describeFrontier(state));

  if (current) {
    lines.push(
      `- Current observed state: ${describeObservation(current)}${current.visits > 1 ? ` (seen ${current.visits} times)` : ""}`,
    );
  }

  lines.push(...navigationLines);
  lines.push(...branchLines);

  if (state.inventory.length) {
    lines.push(`- Held / seen items: ${state.inventory.join(", ")}`);
  }

  const navCurrent = currentNavigationState(state);
  if (navCurrent) {
    const hasUnexplored = Object.values(navCurrent.exits).some(isUnexploredExit);
    const hasVisitedReturn = Object.values(navCurrent.exits).some(
      (exit) => exit.status === "open" && Boolean(exit.targetKey),
    );
    if (hasUnexplored && hasVisitedReturn) {
      lines.push("- Prefer unexplored exits before reversing into a visited state.");
    }
  }

  if (state.navigation.oscillations.length) {
    lines.push(`- Avoid oscillation: ${state.navigation.oscillations[state.navigation.oscillations.length - 1]}`);
  }

  lines.push(...concernLines);
  return lines.join("\n");
}

export function getNavigationAdvisory(state, toolName, args = {}) {
  if (!state?.navigation?.enabled || !isMoveTool(toolName, args)) return null;

  const nav = state.navigation;
  const direction = normalizeDirection(args.direction);
  const current = currentNavigationState(state);
  if (!direction || !current) return null;

  const exit = current.exits[direction];
  if (!exit || exit.status !== "open" || !exit.targetKey) return null;

  // Narrow to the reported bug: hard-gate ONLY immediate re-entry into the
  // cell the agent just left. Broader "any visited target" would escalate
  // legitimate hub traversal (current cell has unexplored AND a visited
  // edge to a non-just-left state) into EXIT_REASONS.OSCILLATION via the
  // 3-strike in content.js. Soft "prefer unexplored elsewhere" guidance
  // rides on the frontier line in the prompt instead.
  const justLeftKey = lastCameFromKey(nav);
  if (!justLeftKey || exit.targetKey !== justLeftKey) return null;

  const unexploredHere = Object.entries(current.exits)
    .filter(([dir, candidate]) => dir !== direction && isUnexploredExit(candidate))
    .map(([dir]) => dir);
  if (unexploredHere.length === 0) return null;

  const target = nav.states.get(exit.targetKey);
  const targetLabel = target?.label || exit.targetKey;
  const alts = unexploredHere.join(", ");
  const verb = unexploredHere.length === 1 ? "is" : "are";

  return `Navigation memory: ${direction} returns to ${targetLabel} (the cell you just left) while ${alts} ${verb} still unexplored from here. Explore an unexplored exit first unless you're deliberately backtracking.`;
}

export function getWorkingMemoryAdvisory(state, toolName, args = {}) {
  return getNavigationAdvisory(state, toolName, args) || genericActionAdvisory(state, toolName, args);
}
