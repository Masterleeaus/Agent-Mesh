/**
 * Message normalization.
 *
 * Internal representation (what content.js stores in history and what the
 * sidebar pushes on USER_MESSAGE):
 *
 *   { role: "system" | "user" | "assistant",
 *     content: string | Array<ContentPart> }
 *   ContentPart:
 *     { type: "text",  text: string }
 *     { type: "image", blob: Blob, mime: string }
 *     { type: "audio", blob: Blob, mime: string }
 *
 * This module converts that internal shape to the wire format of each
 * provider (`normalizeForOpenRouter`, `normalizeForBuiltIn`), stripping
 * unsupported modality parts and annotating the text with a note so the
 * model knows an attachment was intentionally omitted.
 */

const STRIP_NOTE = {
  image: "[Note: image attachment omitted — current model doesn't support it]",
  audio: "[Note: audio attachment omitted — current model doesn't support it]",
};

/** True if any message has image/audio parts in its content array. */
export function hasMultimodal(messages) {
  for (const m of messages) {
    if (!Array.isArray(m?.content)) continue;
    for (const p of m.content) {
      if (p?.type === "image" || p?.type === "audio") return true;
    }
  }
  return false;
}

export async function normalizeForOpenRouter(messages, opts = {}) {
  const supports = opts.supports ?? { image: true, audio: true };
  const stripped = [];
  const out = [];

  for (const msg of messages) {
    if (typeof msg.content === "string" || !Array.isArray(msg.content)) {
      out.push({ role: msg.role, content: msg.content });
      continue;
    }

    const parts = [];
    const notes = [];
    for (const part of msg.content) {
      if (part.type === "text") {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "image") {
        if (!supports.image) {
          stripped.push({ role: msg.role, kind: "image" });
          notes.push(STRIP_NOTE.image);
          continue;
        }
        parts.push({
          type: "image_url",
          image_url: { url: await blobToDataUrl(part.blob, part.mime) },
        });
      } else if (part.type === "audio") {
        if (!supports.audio) {
          stripped.push({ role: msg.role, kind: "audio" });
          notes.push(STRIP_NOTE.audio);
          continue;
        }
        parts.push({
          type: "input_audio",
          input_audio: {
            data: await blobToBase64(part.blob),
            format: guessAudioFormat(part.mime),
          },
        });
      }
    }

    out.push(finalizeOpenRouterMessage(msg.role, parts, notes));
  }

  return { messages: out, stripped };
}

/**
 * Normalize internal messages into a Gemini request body shape.
 *
 * Gemini's wire format is genuinely different from OpenAI-compat: roles
 * are "user" | "model" (assistant → model), system messages are
 * out-of-band in `systemInstruction`, and parts use `inlineData` for
 * images/audio instead of `image_url` / `input_audio`.
 *
 * Returns { body, stripped } where `body` is the request body minus
 * `generationConfig` (caller adds that — it's provider-level config,
 * not message-level). `stripped` is the {role, kind} list of dropped
 * media parts for sidebar capability-warning UX.
 */
export async function normalizeForGemini(messages, opts = {}) {
  const supports = opts.supports ?? { image: true, audio: true };
  const stripped = [];
  const contents = [];
  const systemText = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      if (typeof msg.content === "string") {
        if (msg.content) systemText.push(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part?.type === "text" && part.text) systemText.push(part.text);
        }
      }
      continue;
    }

    const role = msg.role === "assistant" ? "model" : "user";

    if (typeof msg.content === "string" || !Array.isArray(msg.content)) {
      contents.push({ role, parts: [{ text: String(msg.content ?? "") }] });
      continue;
    }

    const parts = [];
    const notes = [];
    for (const part of msg.content) {
      if (part.type === "text") {
        parts.push({ text: part.text });
      } else if (part.type === "image") {
        if (!supports.image) {
          stripped.push({ role: msg.role, kind: "image" });
          notes.push(STRIP_NOTE.image);
          continue;
        }
        parts.push({
          inlineData: {
            mimeType: part.mime || part.blob?.type || "image/png",
            data: await blobToBase64(part.blob),
          },
        });
      } else if (part.type === "audio") {
        if (!supports.audio) {
          stripped.push({ role: msg.role, kind: "audio" });
          notes.push(STRIP_NOTE.audio);
          continue;
        }
        parts.push({
          inlineData: {
            mimeType: part.mime || part.blob?.type || "audio/wav",
            data: await blobToBase64(part.blob),
          },
        });
      }
    }

    contents.push({ role, parts: finalizeGeminiParts(parts, notes) });
  }

  const body = { contents };
  if (systemText.length > 0) {
    body.systemInstruction = { parts: [{ text: systemText.join("\n") }] };
  }
  return { body, stripped };
}

function finalizeGeminiParts(parts, notes) {
  if (notes.length === 0) return parts;
  const hasMedia = parts.some((p) => !("text" in p));
  if (!hasMedia) {
    const textJoined = parts.map((p) => p.text ?? "").join("\n");
    return [{ text: [...notes, textJoined].filter(Boolean).join("\n") }];
  }
  const textIdx = parts.findIndex((p) => "text" in p);
  const annotated = [...notes, textIdx >= 0 ? parts[textIdx].text : ""]
    .filter(Boolean)
    .join("\n");
  if (textIdx >= 0) parts[textIdx] = { text: annotated };
  else parts.unshift({ text: annotated });
  return parts;
}

export async function normalizeForBuiltIn(messages, opts = {}) {
  const supports = opts.supports ?? { image: true, audio: true };
  const stripped = [];
  const out = [];

  for (const msg of messages) {
    if (typeof msg.content === "string" || !Array.isArray(msg.content)) {
      out.push({ role: msg.role, content: msg.content });
      continue;
    }

    const parts = [];
    const notes = [];
    for (const part of msg.content) {
      if (part.type === "text") {
        parts.push({ type: "text", value: part.text });
      } else if (part.type === "image") {
        if (!supports.image) {
          stripped.push({ role: msg.role, kind: "image" });
          notes.push(STRIP_NOTE.image);
          continue;
        }
        parts.push({ type: "image", value: part.blob });
      } else if (part.type === "audio") {
        if (!supports.audio) {
          stripped.push({ role: msg.role, kind: "audio" });
          notes.push(STRIP_NOTE.audio);
          continue;
        }
        parts.push({ type: "audio", value: part.blob });
      }
    }

    out.push(finalizeBuiltInMessage(msg.role, parts, notes));
  }

  return { messages: out, stripped };
}

function finalizeOpenRouterMessage(role, parts, notes) {
  const hasMedia = parts.some((p) => p.type !== "text");
  if (notes.length > 0 && !hasMedia) {
    // No surviving media → collapse to a single annotated string.
    const textJoined = parts.map((p) => p.text).join("\n");
    return { role, content: [...notes, textJoined].filter(Boolean).join("\n") };
  }
  if (notes.length > 0 && hasMedia) {
    // Annotate the (or a synthetic) text part and keep the array form.
    const textIdx = parts.findIndex((p) => p.type === "text");
    const annotated = [...notes, textIdx >= 0 ? parts[textIdx].text : ""]
      .filter(Boolean)
      .join("\n");
    const annotatedPart = { type: "text", text: annotated };
    if (textIdx >= 0) parts[textIdx] = annotatedPart;
    else parts.unshift(annotatedPart);
  }
  if (parts.length === 1 && parts[0].type === "text") {
    return { role, content: parts[0].text };
  }
  return { role, content: parts };
}

function finalizeBuiltInMessage(role, parts, notes) {
  const hasMedia = parts.some((p) => p.type !== "text");
  if (notes.length > 0 && !hasMedia) {
    const textJoined = parts.map((p) => p.value).join("\n");
    return { role, content: [...notes, textJoined].filter(Boolean).join("\n") };
  }
  if (notes.length > 0 && hasMedia) {
    const textIdx = parts.findIndex((p) => p.type === "text");
    const annotated = [...notes, textIdx >= 0 ? parts[textIdx].value : ""]
      .filter(Boolean)
      .join("\n");
    const annotatedPart = { type: "text", value: annotated };
    if (textIdx >= 0) parts[textIdx] = annotatedPart;
    else parts.unshift(annotatedPart);
  }
  if (parts.length === 1 && parts[0].type === "text") {
    return { role, content: parts[0].value };
  }
  return { role, content: parts };
}

async function blobToDataUrl(blob, mime) {
  // Fast path: FileReader in the browser hands us `data:<mime>;base64,<…>`
  // natively. Avoids the O(n) charCode loop that blew memory on large
  // attachments (a 10 MB image allocates 10 MB of intermediate strings with
  // the fallback).
  if (typeof FileReader !== "undefined") {
    const dataUrl = await readAsDataUrl(blob);
    if (mime && !dataUrl.startsWith(`data:${mime}`)) {
      // Rewrite the MIME prefix only if caller explicitly overrides it.
      return `data:${mime};base64,${dataUrl.split(",")[1] || ""}`;
    }
    return dataUrl;
  }
  const bytes = await readBlobBytes(blob);
  return `data:${mime || blob.type || "application/octet-stream"};base64,${bytesToBase64(bytes)}`;
}

async function blobToBase64(blob) {
  if (typeof FileReader !== "undefined") {
    const dataUrl = await readAsDataUrl(blob);
    return dataUrl.split(",")[1] || "";
  }
  return bytesToBase64(await readBlobBytes(blob));
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

async function readBlobBytes(blob) {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Uint8Array(await new Response(blob).arrayBuffer());
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function guessAudioFormat(mime) {
  if (!mime) return "wav";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("webm")) return "webm";
  return "wav";
}
