/**
 * Ref-map for the perception snapshot.
 *
 * The LLM identifies elements across ReAct steps via opaque
 * `ref_{version}_{n}` uids returned from `take_snapshot`. The refmap maps
 * each uid to the underlying DOM Element via `WeakRef`, so the agent-facing
 * identity outlives a single tool call but doesn't prevent the DOM from
 * being GC'd when the page navigates or re-renders.
 *
 * Seal token: an opaque string that the caller hands back with every
 * element-targeted tool call. A mismatch means the snapshot is stale and
 * the agent is instructed to call take_snapshot again. `bumpSeal` rotates
 * the seal AND clears the map.
 *
 * Version-qualified uids (F21): `bumpSeal` returns the new version number;
 * the walker bakes it into every uid. This is a second line of defense
 * behind the seal check — even if the agent carries the LATEST seal
 * forward but pairs it with an OLD uid, the lookup fails at the map key
 * because "ref_1_3" is literally not a key in a version-2 map. Uid
 * numbering is owned by the walker (caller-provided uid on allocate) so
 * the version segment matches what the text form shows.
 *
 * The test helper `__simulateCollected(uid)` exists so jsdom tests (which
 * don't expose explicit GC) can exercise the dead-WeakRef branch without
 * relying on real garbage collection.
 */

// Seal token is opaque, URL-free, and stamp-backed so successive bumps
// produce distinct strings even at the same millisecond on most systems.
// URLs (path/query/fragment can carry tokens like /reset?token=…) are kept
// as internal state only; the seal the agent sees never rides with them.
let sealCounter = 0;

function freshSealToken({ version }) {
  sealCounter += 1;
  const stamp = Date.now();
  return `seal_${version}_${stamp}_${sealCounter}`;
}

export function createRefmap() {
  // uid -> WeakRef<Element>  (any object that supports WeakRef works in tests)
  const map = new Map();
  let version = 0;
  let url = "";
  let seal = freshSealToken({ version });

  // Caller-provided uid. The walker knows the version (we give it to them
  // via bumpSeal's return value) and owns per-snapshot numbering, so we
  // don't need to mint ids here. Last-write-wins on repeat keys — the
  // walker guarantees per-snapshot uniqueness by design.
  function allocate(uid, element) {
    map.set(uid, new WeakRef(element));
  }

  function get(uid) {
    const ref = map.get(uid);
    if (!ref) return null;
    const el = ref.deref();
    if (el === undefined) return null;
    return el;
  }

  function clear() {
    map.clear();
  }

  function bumpSeal({ reason, url: nextUrl }) {
    version += 1;
    url = nextUrl ?? url;
    seal = freshSealToken({ version });
    map.clear();
    return { seal, reason, version };
  }

  function currentSeal() {
    return seal;
  }

  function currentVersion() {
    return version;
  }

  // Test-only — replace the WeakRef with one whose deref() returns undefined.
  function __simulateCollected(uid) {
    map.set(uid, { deref: () => undefined });
  }

  return {
    allocate,
    get,
    clear,
    bumpSeal,
    currentSeal,
    currentVersion,
    __simulateCollected,
  };
}
