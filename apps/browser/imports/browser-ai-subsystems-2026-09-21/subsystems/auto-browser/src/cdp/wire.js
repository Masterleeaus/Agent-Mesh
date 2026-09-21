const MODIFIER_ALIASES = {
  alt: "alt", option: "alt",
  ctrl: "ctrl", control: "ctrl",
  cmd: "meta", meta: "meta", command: "meta",
  shift: "shift",
};

// Parse a chord like "cmd+a" or "ctrl+shift+p" into {key, modifiers}.
// Modifier names are case-insensitive; the final key preserves its input case.
//
// Rejects (fail-fast so wrong key events never dispatch):
//   - empty / non-string input
//   - empty segments: "ctrl+", "+a", "ctrl++a" — caught by detecting any
//     empty string after splitting on "+"; filtering them out silently is
//     how typos like a trailing "+" became real dispatched keystrokes
//   - unknown modifier names (names the offender)
//   - final token being a modifier name — the user almost certainly meant
//     "ctrl+shift+<key>"; treating the trailing modifier as the key would
//     dispatch the wrong event
export function parseKeyChord(chord) {
  if (typeof chord !== "string" || !chord.trim()) {
    throw new Error("parseKeyChord: chord must be a non-empty string");
  }
  const parts = chord.split("+").map((s) => s.trim());
  if (parts.some((p) => p === "")) {
    throw new Error(`parseKeyChord: malformed chord "${chord}" — empty segment (check for leading, trailing, or consecutive "+")`);
  }
  const key = parts.pop();
  if (MODIFIER_ALIASES[key.toLowerCase()]) {
    throw new Error(`parseKeyChord: final key "${key}" cannot be a modifier. Did you forget a key after the modifiers?`);
  }
  const modifiers = { alt: false, ctrl: false, meta: false, shift: false };
  for (const raw of parts) {
    const canonical = MODIFIER_ALIASES[raw.toLowerCase()];
    if (!canonical) throw new Error(`parseKeyChord: unknown modifier "${raw}"`);
    modifiers[canonical] = true;
  }
  return { key, modifiers };
}

// CDP Input.Modifiers bitmask: alt=1, ctrl=2, meta=4, shift=8.
export function modifierBitmask(mods = {}) {
  let m = 0;
  if (mods.alt) m |= 1;
  if (mods.ctrl) m |= 2;
  if (mods.meta) m |= 4;
  if (mods.shift) m |= 8;
  return m;
}

// CDP Input.dispatchMouseEvent parameter.
// type: "mouseMoved" | "mousePressed" | "mouseReleased"
export function mouseEvent({ type, x, y, button = "left", modifiers = {}, clickCount = 1 }) {
  return { type, x, y, button, modifiers: modifierBitmask(modifiers), clickCount };
}

// CDP Input.dispatchMouseEvent parameter for wheel.
// Delta units are pixels; caller may pre-multiply (Claude for Chrome uses amount × 100).
export function wheelEvent({ x, y, deltaX = 0, deltaY = 0, modifiers = {} }) {
  return { type: "mouseWheel", x, y, deltaX, deltaY, modifiers: modifierBitmask(modifiers) };
}

// CDP Input.insertText parameter. Caller chunks to one char for IME-safe typing
// (see chunkText).
export function insertTextEvent(text) {
  return { text: text == null ? "" : String(text) };
}

// CDP Input.dispatchKeyEvent parameter.
// type: "keyDown" | "keyUp" | "char" | "rawKeyDown"
// Optional fields (text, code, virtualKeyCodes) are included only when provided.
export function keyEvent({ type, key, modifiers = {}, text, code, windowsVirtualKeyCode, nativeVirtualKeyCode }) {
  const payload = { type, key, modifiers: modifierBitmask(modifiers) };
  if (text !== undefined) payload.text = text;
  if (code !== undefined) payload.code = code;
  if (windowsVirtualKeyCode !== undefined) payload.windowsVirtualKeyCode = windowsVirtualKeyCode;
  if (nativeVirtualKeyCode !== undefined) payload.nativeVirtualKeyCode = nativeVirtualKeyCode;
  return payload;
}

// CDP Page.captureScreenshot parameter.
export function screenshotParams({ format = "png", quality, clip, captureBeyondViewport = false } = {}) {
  const p = { format };
  if (format === "jpeg" && typeof quality === "number") p.quality = quality;
  if (clip) p.clip = clip;
  if (captureBeyondViewport) p.captureBeyondViewport = true;
  return p;
}

// Ordered trio of mouse events producing a click when dispatched in order via
// src/cdp/driver.js. The 100 ms delay between mouseMoved and mousePressed is the
// caller's job — wire.js stays pure.
export function clickSequence({ x, y, button = "left", modifiers = {}, clickCount = 1 }) {
  return [
    mouseEvent({ type: "mouseMoved", x, y, button, modifiers, clickCount: 0 }),
    mouseEvent({ type: "mousePressed", x, y, button, modifiers, clickCount }),
    mouseEvent({ type: "mouseReleased", x, y, button, modifiers, clickCount }),
  ];
}

// Split text into chunks so IME-safe typing can dispatch one insertText per char.
// Throws with an actionable message on invalid size.
export function chunkText(text, size = 1) {
  if (typeof size !== "number" || size <= 0 || !Number.isFinite(size)) {
    throw new Error("chunkText: size must be a positive finite number");
  }
  const s = text == null ? "" : String(text);
  if (s.length === 0) return [];
  const out = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
