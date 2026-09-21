import { wrap, btn } from "./layout.js";
import type { AttentionOwnerEmailData } from "./types.js";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

export function attentionOwnerEmailHtml(d: AttentionOwnerEmailData): string {
  const summary = d.summary ? `<p style="color:#57534e;margin:8px 0">${escapeHtml(d.summary)}</p>` : "";
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">${escapeHtml(d.title)}</h2>
    ${summary}
    <p style="margin:18px 0">${btn("Open in app", d.href)}</p>
    <p style="font-size:12px;color:#78716c;margin-top:24px">You received this because something needs attention in Titan Zero.</p>
  `);
}
