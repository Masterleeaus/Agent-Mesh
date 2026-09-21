/**
 * Incremental Server-Sent Events decoder.
 *
 * Three properties of the WHATWG event-stream grammar make line-at-a-time
 * parsing unsafe rather than merely non-conforming:
 *
 *   1. A line ends with CRLF, LF, **or CR**. Splitting on "\n" leaves a
 *      CR-delimited stream as one giant line, so its events are never seen.
 *   2. An event may carry **repeated `data` fields**, joined with "\n". Parsing
 *      each one alone means a multi-field event is never valid JSON.
 *   3. An event is dispatched only at a **blank line**. Acting on a `data` line
 *      before that boundary acts on something the server never committed.
 *
 * Each of those lets a provider's terminal error event slip past the in-band
 * error guard while partial content keeps accumulating — and partial content
 * that happens to parse becomes a dispatched tool call. So this is a safety
 * primitive, not a formatting nicety: the decoder is what decides whether the
 * guard ever runs.
 *
 * Three invariants follow from that role and are worth stating outright:
 *
 *   - **Events are released the moment they are complete.** A decoder that
 *     needed the transport to close before surfacing a terminal error would be
 *     useless against a provider that sends the error and holds the socket
 *     open, which is exactly the case the guard exists for.
 *   - **Nothing is retained without a bound.** A peer that never sends a line
 *     terminator must not be able to grow our buffers or our per-chunk work.
 *   - **A truncated event is never reported clean.** Callers fail closed on
 *     `hasIncompleteTail()`, so anything short of a real blank boundary has to
 *     read as open.
 *
 * Deliberately pure and synchronous — `push()` takes decoded text and returns
 * complete events. That keeps the grammar testable without streams, which is
 * where the subtle cases (split CRLF across chunks, lone trailing CR) live.
 */

// A single event that never terminates would otherwise grow without bound.
const DEFAULT_MAX_EVENT_CHARS = 1_000_000;

// Longest prefix that can introduce a `data` value.
const MAX_DATA_PREFIX = "data: ".length;

// Keeps each String.fromCharCode spread below the argument limit.
const COPY_STRIDE = 0x8000;

// Keeps the derived line bound exact rather than losing precision.
const MAX_CONFIGURED_EVENT_CHARS = Number.MAX_SAFE_INTEGER - MAX_DATA_PREFIX;

/**
 * A flat copy that owns its characters.
 *
 * V8 represents a long substring as a view onto its parent, so retaining one
 * pins the entire transport chunk it was cut from — a 100-character value out
 * of a 900 KB chunk holds all 900 KB. Anything kept past the current chunk must
 * therefore be copied, or `maxEventChars` bounds only the logical payload while
 * actual heap grows without limit.
 *
 * Round-tripping through code units (rather than a text codec) keeps this
 * lossless for lone surrogates, which a UTF-8 codec would replace.
 */
function ownedCopy(text) {
  const units = new Uint16Array(text.length);
  for (let i = 0; i < text.length; i += 1) units[i] = text.charCodeAt(i);
  if (units.length <= COPY_STRIDE) return String.fromCharCode(...units);
  const parts = [];
  for (let i = 0; i < units.length; i += COPY_STRIDE) {
    parts.push(String.fromCharCode(...units.subarray(i, i + COPY_STRIDE)));
  }
  return parts.join("");
}

export function createSseDecoder({ maxEventChars = DEFAULT_MAX_EVENT_CHARS } = {}) {
  // Refuse anything that would not compare as a bound. `NaN` and `Infinity`
  // make every `> max` test false, silently removing the limit this option
  // exists to impose; a numeric string turns the derivation below into string
  // concatenation. A primitive whose whole contract is a bound has to fail loudly
  // at construction rather than quietly stop bounding at runtime.
  if (
    !Number.isSafeInteger(maxEventChars) ||
    maxEventChars < 0 ||
    maxEventChars > MAX_CONFIGURED_EVENT_CHARS
  ) {
    throw new RangeError(
      `maxEventChars must be a non-negative safe integer, received ${String(maxEventChars)}`,
    );
  }

  // Bounds one physical line, independently of how much payload the event has
  // already accepted. The offset makes it provably looser than the event cap:
  // the longest prefix that can introduce a value is "data: ", so a value the
  // event cap would accept can never trip this.
  const maxLineChars = maxEventChars + MAX_DATA_PREFIX;

  let pending = ""; // current line, not yet terminated
  let lineDropped = false; // `pending` blew the guard and was discarded
  let swallowLf = false; // previous chunk ended on CR; a leading LF completes it
  let eventOpen = false; // a nonblank line has been seen since the last boundary
  let dataLines = [];
  let dataChars = 0;
  let overflowed = false;

  function resetEvent() {
    dataLines = [];
    dataChars = 0;
    overflowed = false;
  }

  // Returns an event when `line` is the blank line that commits one.
  function consumeLine(line) {
    if (line === "") {
      if (overflowed) {
        resetEvent();
        return { data: "", overflowed: true };
      }
      if (dataLines.length === 0) return null; // stray blank line
      const data = dataLines.join("\n");
      resetEvent();
      return { data, overflowed: false };
    }
    if (overflowed) return null; // only the boundary matters now
    // ":" in column 0 is a comment (keep-alive). Ignore, do not dispatch.
    if (line.startsWith(":")) return null;

    const colon = line.indexOf(":");
    const name = colon < 0 ? line : line.slice(0, colon);
    if (name !== "data") return null; // event:/id:/retry: carry no payload here
    let value = colon < 0 ? "" : line.slice(colon + 1);
    // Exactly one optional leading space is stripped, per the grammar.
    if (value.startsWith(" ")) value = value.slice(1);

    // The emitted payload joins fields with "\n", so a separator exists only
    // from the second field on. Charging one per field would reject an event
    // whose real length is exactly the cap.
    const separator = dataLines.length === 0 ? 0 : 1;
    const next = dataChars + separator + value.length;
    if (next > maxEventChars) {
      overflowed = true;
      dataLines = [];
      return null;
    }
    dataChars = next;
    dataLines.push(ownedCopy(value));
    return null;
  }

  function dropLine(text) {
    // Only a `data:` line can contribute payload. The grammar requires every
    // other field to be ignored, so discarding an oversized comment or
    // `event:`/`id:`/`retry:` line must not fail an otherwise valid event.
    const head = pending.length >= 5 ? pending : pending + text.slice(0, 5);
    lineDropped = true;
    pending = "";
    if (head.startsWith("data:")) {
      overflowed = true;
      dataLines = [];
    }
  }

  // Guards the in-flight line. Without this the cap is only enforced once a
  // terminator arrives, so a peer that never sends one is unbounded.
  function appendPending(text, own) {
    if (lineDropped || text === "") return;
    if (pending.length + text.length > maxLineChars) {
      dropLine(text);
      return;
    }
    pending += own ? ownedCopy(text) : text;
  }

  function endLine(events) {
    const line = pending;
    const dropped = lineDropped;
    pending = "";
    lineDropped = false;
    // A dropped line always held content, so it can never have been the blank
    // line that commits an event — it leaves the event open like any other.
    eventOpen = dropped || line !== "";
    if (dropped) return;
    const event = consumeLine(line);
    if (event) events.push(event);
  }

  return {
    /** @param {string} chunk decoded text @returns {Array<{data:string,overflowed:boolean}>} */
    push(chunk) {
      const events = [];
      let i = 0;
      // A CR already ended its line; a following LF is only the second half of
      // a CRLF. An empty chunk settles nothing, so the bit must survive it.
      if (swallowLf && chunk.length > 0) {
        swallowLf = false;
        if (chunk[0] === "\n") i = 1;
      }

      let start = i;
      while (i < chunk.length) {
        const ch = chunk[i];
        if (ch !== "\n" && ch !== "\r") { i += 1; continue; }
        appendPending(chunk.slice(start, i), false); // dies with this call
        endLine(events);
        if (ch === "\r" && i + 1 === chunk.length) {
          // Can't yet see whether a partner LF follows; defer only that bit,
          // never the line itself.
          swallowLf = true;
          i += 1;
        } else {
          i += (ch === "\r" && chunk[i + 1] === "\n") ? 2 : 1;
        }
        start = i;
      }
      // Only the unterminated remainder is carried, so work stays linear in the
      // size of each chunk rather than of the stream so far. It outlives this
      // chunk, so it is copied rather than left as a view onto it.
      appendPending(chunk.slice(start), true);
      return events;
    },

    /**
     * Whether the stream ended mid-event. An uncommitted tail must NOT be
     * dispatched: the server never finished sending it, so treating it as a
     * decision would act on output that was never committed.
     *
     * Every term is state that means "mid-something". Some imply others today;
     * they are listed separately so decoupling them later cannot quietly turn
     * this fail-closed answer into a clean one.
     */
    hasIncompleteTail() {
      return (
        pending.length > 0 || // an unterminated line is in flight
        lineDropped || //        ...whose content we discarded
        eventOpen || //          a field line arrived with no blank boundary yet
        dataLines.length > 0 ||
        overflowed
      );
    },
  };
}
