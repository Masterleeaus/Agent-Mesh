"use client";

import { useState } from "react";

export interface CustomerAcknowledgementValue {
  customer_name: string;
  customer_email: string | null;
  acknowledgement_notes: string | null;
  acknowledged_at: string;
}

export function CustomerAcknowledgement({
  visitId,
  initialValue,
  defaultName,
  defaultEmail,
}: {
  visitId: string;
  initialValue: CustomerAcknowledgementValue | null;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const [name, setName] = useState(initialValue?.customer_name ?? defaultName ?? "");
  const [email, setEmail] = useState(initialValue?.customer_email ?? defaultEmail ?? "");
  const [notes, setNotes] = useState(initialValue?.acknowledgement_notes ?? "");
  const [saved, setSaved] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/v1/visits/${visitId}/acknowledgement`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer_name: name, customer_email: email.trim() || null, acknowledgement_notes: notes.trim() || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Failed to save acknowledgement");
      setSaved(payload.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save acknowledgement");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)", margin: 0 }}>
        Records that the customer reviewed the completed service report. This is not a payment confirmation, warranty waiver, or legal release.
      </p>
      <label style={{ display: "grid", gap: 4 }}>Customer name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label style={{ display: "grid", gap: 4 }}>Customer email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label style={{ display: "grid", gap: 4 }}>Acknowledgement notes<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {saved && <div style={{ color: "#16a34a", fontSize: "var(--text-sm)" }}>Acknowledged {new Date(saved.acknowledged_at).toLocaleString()}</div>}
      {error && <div style={{ color: "#dc2626", fontSize: "var(--text-sm)" }}>{error}</div>}
      <button type="button" onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : saved ? "Update acknowledgement" : "Record acknowledgement"}</button>
    </div>
  );
}
