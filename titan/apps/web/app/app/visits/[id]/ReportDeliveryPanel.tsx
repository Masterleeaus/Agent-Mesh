"use client";

import { useState } from "react";

export type ReportDeliveryValue = {
  recipient_email: string | null;
  delivery_count: number;
  last_queued_at: string | null;
  queue_status: string | null;
  sent_at: string | null;
};

export function ReportDeliveryPanel({
  visitId,
  defaultEmail,
  initialValue,
}: {
  visitId: string;
  defaultEmail: string | null;
  initialValue: ReportDeliveryValue | null;
}) {
  const [email, setEmail] = useState(initialValue?.recipient_email ?? defaultEmail ?? "");
  const [state, setState] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/v1/visits/${visitId}/report-delivery`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipient_email: email.trim() || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Failed to queue service report");
      setState(payload.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to queue service report");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}>
        Email the completed report through Titan&apos;s notification queue. The private report link can be resent without changing the customer&apos;s acknowledgement.
      </p>
      <label style={{ display: "grid", gap: 4 }}>
        Recipient email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {state && (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}>
          Delivery #{state.delivery_count} · {state.queue_status ?? "queued"}
          {state.sent_at ? ` · sent ${new Date(state.sent_at).toLocaleString()}` : state.last_queued_at ? ` · queued ${new Date(state.last_queued_at).toLocaleString()}` : ""}
        </div>
      )}
      {error && <div style={{ color: "#dc2626", fontSize: "var(--text-sm)" }}>{error}</div>}
      <button type="button" onClick={send} disabled={busy || !email.trim()}>
        {busy ? "Queueing…" : state ? "Resend service report" : "Email service report"}
      </button>
    </div>
  );
}
