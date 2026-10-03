"use client";

import { useState } from "react";

/** Calls the canonical cookie-authenticated company switch API. The current
 * session supplies the choices; the selected value itself grants no access. */
export function CompanySwitcher({
  companyIds,
  currentCompanyId,
}: {
  companyIds: readonly string[];
  currentCompanyId: string;
}) {
  const choices = [...new Set(companyIds)].filter(Boolean);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (choices.length < 2 || !choices.includes(currentCompanyId)) return null;

  async function switchCompany(targetCompanyId: string) {
    if (!targetCompanyId || targetCompanyId === currentCompanyId || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/switch-company", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company_id: targetCompanyId }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(result?.error?.message || "Could not switch company.");
      }
      // The endpoint replaces the current canonical credential in the cookie.
      // Reload so every server component resolves only the new company scope.
      window.location.assign("/app");
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Could not switch company.");
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 4, padding: "8px 10px" }}>
      <label htmlFor="canonical-company-switcher" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
        Company
      </label>
      <select
        id="canonical-company-switcher"
        aria-label="Company"
        value={currentCompanyId}
        disabled={pending}
        onChange={event => void switchCompany(event.currentTarget.value)}
        style={{ width: "100%", minWidth: 0 }}
      >
        {choices.map(companyId => <option key={companyId} value={companyId}>{companyId}</option>)}
      </select>
      {pending ? <span role="status">Switching company…</span> : null}
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
