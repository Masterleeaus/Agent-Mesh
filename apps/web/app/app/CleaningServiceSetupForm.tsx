"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, SectionHeader } from "@/components/ui";

type PricingMode = "fixed" | "hourly" | "quote_required";
type Frequency = "weekly" | "fortnightly" | "monthly" | "custom";
type CatalogueItem = {
  service_id: string;
  label: string;
  description: string;
  retained_job_type_id: string | null;
  pricing_hints: PricingMode[];
  default_pricing_hint: string;
  quote_required: boolean;
  recurring_supported: boolean;
  unavailable_reason: string | null;
};
type SavedSelection = {
  service_id: string;
  mode: PricingMode;
  fixed_price: string;
  hourly_rate: string;
  minimum_charge: string;
};
type SetupResponse = {
  data: {
    revision: number;
    selections: Array<{ job_type_id: string; service_label: string; pricing: { mode: PricingMode; fixed_price: number | null; hourly_rate: number | null; minimum_charge: number | null } }>;
    recurrence: { enabled: boolean; supported_frequencies: Frequency[]; default_frequency: Frequency | null };
  };
  catalogue: CatalogueItem[];
};

const frequencies: Array<{ id: Frequency; label: string }> = [
  { id: "weekly", label: "Weekly" },
  { id: "fortnightly", label: "Fortnightly" },
  { id: "monthly", label: "Monthly" },
  { id: "custom", label: "Custom interval" },
];

function savedPrice(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function priceValue(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function CleaningServiceSetupForm() {
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [selections, setSelections] = useState<SavedSelection[]>([]);
  const [recurring, setRecurring] = useState<{ enabled: boolean; supported_frequencies: Frequency[]; default_frequency: Frequency | null }>({
    enabled: false,
    supported_frequencies: [],
    default_frequency: null,
  });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const catalogueById = useMemo(() => new Map(catalogue.map(item => [item.service_id, item])), [catalogue]);
  const recurringServices = selections.filter(selection => catalogueById.get(selection.service_id)?.recurring_supported);

  async function loadSetup() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/cleaning/service-setup", { cache: "no-store" });
      const result = await response.json() as SetupResponse & { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message || "Could not load service setup.");
      setCatalogue(result.catalogue);
      setRevision(result.data.revision);
      setSelections(result.data.selections.flatMap(saved => {
        const item = result.catalogue.find(candidate => candidate.label === saved.service_label && candidate.retained_job_type_id === saved.job_type_id);
        if (!item) return [];
        return [{
          service_id: item.service_id,
          mode: saved.pricing.mode,
          fixed_price: savedPrice(saved.pricing.fixed_price),
          hourly_rate: savedPrice(saved.pricing.hourly_rate),
          minimum_charge: savedPrice(saved.pricing.minimum_charge),
        }];
      }));
      setRecurring({
        enabled: result.data.recurrence.enabled,
        supported_frequencies: result.data.recurrence.supported_frequencies,
        default_frequency: result.data.recurrence.default_frequency,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load service setup.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadSetup(); }, []);

  function toggleService(item: CatalogueItem, enabled: boolean) {
    setError(null);
    setNotice(null);
    if (enabled && item.retained_job_type_id && !item.unavailable_reason) {
      const duplicate = selections.find(selection => catalogueById.get(selection.service_id)?.retained_job_type_id === item.retained_job_type_id);
      if (duplicate) {
        setError(`Choose either ${catalogueById.get(duplicate.service_id)?.label} or ${item.label}; both map to the same native Cleaning job type.`);
        return;
      }
    }
    setSelections(previous => {
      if (!enabled) return previous.filter(selection => selection.service_id !== item.service_id);
      if (!item.retained_job_type_id || item.unavailable_reason) return previous;
      const mode = item.quote_required ? "quote_required" : item.pricing_hints.includes(item.default_pricing_hint as PricingMode)
        ? item.default_pricing_hint as PricingMode
        : item.pricing_hints[0];
      if (!mode) return previous;
      return [...previous, { service_id: item.service_id, mode, fixed_price: "", hourly_rate: "", minimum_charge: "" }];
    });
  }

  function updateSelection(serviceId: string, patch: Partial<SavedSelection>) {
    setSelections(previous => previous.map(selection => selection.service_id === serviceId ? { ...selection, ...patch } : selection));
    setError(null);
    setNotice(null);
  }

  function toggleFrequency(frequency: Frequency, enabled: boolean) {
    setRecurring(previous => {
      const supported_frequencies = enabled
        ? [...new Set([...previous.supported_frequencies, frequency])]
        : previous.supported_frequencies.filter(item => item !== frequency);
      return {
        ...previous,
        supported_frequencies,
        default_frequency: previous.default_frequency && supported_frequencies.includes(previous.default_frequency)
          ? previous.default_frequency
          : null,
      };
    });
    setError(null);
    setNotice(null);
  }

  async function saveSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/v1/cleaning/service-setup", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expected_revision: revision,
          selections: selections.map(selection => ({
            service_id: selection.service_id,
            mode: selection.mode,
            fixed_price: priceValue(selection.fixed_price),
            hourly_rate: priceValue(selection.hourly_rate),
            minimum_charge: priceValue(selection.minimum_charge),
          })),
          recurring,
        }),
      });
      const result = await response.json() as { data?: { revision: number }; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message || "Could not save service setup.");
      setRevision(result.data?.revision ?? revision + 1);
      setNotice("Cleaning service setup saved for this company.");
      await loadSetup();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save service setup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <SectionHeader title="Cleaning service setup" />
      <p>Choose the Cleaning services your company offers. Enter your own fixed prices or hourly rates. Quote-required services stay quote-required.</p>
      {loading ? <p role="status">Loading company service setup…</p> : null}
      {!loading && error && catalogue.length === 0 ? (
        <div role="alert"><p>{error}</p><Button type="button" onClick={() => void loadSetup()}>Retry</Button></div>
      ) : null}
      {!loading && catalogue.length > 0 ? (
        <form onSubmit={saveSetup}>
          <fieldset disabled={saving} style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="sr-only">Cleaning services offered</legend>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {catalogue.map(item => {
                const selected = selections.find(selection => selection.service_id === item.service_id);
                const conflict = !selected && selections.find(selection => item.retained_job_type_id
                  && catalogueById.get(selection.service_id)?.retained_job_type_id === item.retained_job_type_id);
                const disabled = !selected && (!!item.unavailable_reason || !!conflict);
                const reason = item.unavailable_reason || (conflict
                  ? `Choose either this service or ${catalogueById.get(conflict.service_id)?.label}; they share one native job type.`
                  : null);
                return (
                  <section key={item.service_id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-3)" }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        disabled={disabled}
                        onChange={event => toggleService(item, event.currentTarget.checked)}
                        aria-describedby={reason ? `cleaning-service-reason-${item.service_id}` : undefined}
                      />
                      <span><strong>{item.label}</strong><br /><span>{item.description}</span></span>
                    </label>
                    {reason ? <p id={`cleaning-service-reason-${item.service_id}`} style={{ marginLeft: "1.75rem" }}>{reason}</p> : null}
                    {selected ? (
                      <div style={{ display: "grid", gap: "var(--space-2)", margin: "var(--space-3) 0 0 1.75rem", maxWidth: 520 }}>
                        {item.quote_required ? (
                          <p><strong>Quote required.</strong> This service cannot be saved with a fixed price or hourly rate.</p>
                        ) : (
                          <label>
                            Pricing mode
                            <select aria-label={`${item.label} pricing mode`} value={selected.mode} onChange={event => updateSelection(item.service_id, { mode: event.currentTarget.value as PricingMode })}>
                              {item.pricing_hints.map(mode => <option key={mode} value={mode}>{mode === "fixed" ? "Fixed price" : mode === "hourly" ? "Hourly rate" : "Quote required"}</option>)}
                            </select>
                          </label>
                        )}
                        {selected.mode === "fixed" ? (
                          <label>
                            Fixed price
                            <input aria-label={`${item.label} fixed price`} type="number" min="0" step="0.01" required value={selected.fixed_price} onChange={event => updateSelection(item.service_id, { fixed_price: event.currentTarget.value })} />
                          </label>
                        ) : null}
                        {selected.mode === "hourly" ? (
                          <label>
                            Hourly rate
                            <input aria-label={`${item.label} hourly rate`} type="number" min="0" step="0.01" required value={selected.hourly_rate} onChange={event => updateSelection(item.service_id, { hourly_rate: event.currentTarget.value })} />
                          </label>
                        ) : null}
                        <label>
                          Minimum charge (optional)
                          <input aria-label={`${item.label} minimum charge`} type="number" min="0" step="0.01" value={selected.minimum_charge} onChange={event => updateSelection(item.service_id, { minimum_charge: event.currentTarget.value })} />
                        </label>
                        {item.recurring_supported ? <p>This service can be included in supported recurring setup.</p> : null}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </fieldset>

          <fieldset disabled={saving || recurringServices.length === 0} style={{ marginTop: "var(--space-5)" }}>
            <legend>Recurring service options</legend>
            <label><input type="checkbox" checked={recurring.enabled} onChange={event => {
              const enabled = event.currentTarget.checked;
              setRecurring(previous => ({ ...previous, enabled }));
              setError(null);
              setNotice(null);
            }} /> Enable recurring configuration</label>
            {recurring.enabled ? (
              <>
                {recurringServices.length === 0 ? <p>Choose a recurring-capable service first.</p> : null}
                <div>
                  {frequencies.map(frequency => (
                    <label key={frequency.id} style={{ display: "inline-flex", gap: "var(--space-1)", marginRight: "var(--space-3)" }}>
                      <input type="checkbox" checked={recurring.supported_frequencies.includes(frequency.id)} onChange={event => toggleFrequency(frequency.id, event.currentTarget.checked)} />
                      {frequency.label}
                    </label>
                  ))}
                </div>
                <label>
                  Default frequency
                  <select value={recurring.default_frequency ?? ""} onChange={event => {
                    const default_frequency = (event.currentTarget.value || null) as Frequency | null;
                    setRecurring(previous => ({ ...previous, default_frequency }));
                  }}>
                    <option value="">No default</option>
                    {frequencies.filter(frequency => recurring.supported_frequencies.includes(frequency.id)).map(frequency => <option key={frequency.id} value={frequency.id}>{frequency.label}</option>)}
                  </select>
                </label>
              </>
            ) : <p>Choose recurring-capable services and frequencies when the company is ready to configure recurrence.</p>}
          </fieldset>
          {error ? <p role="alert">{error}</p> : null}
          {notice ? <p role="status">{notice}</p> : null}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
            <Button type="submit" disabled={saving || loading || selections.length === 0}>{saving ? "Saving…" : "Save service setup"}</Button>
            <Button type="button" disabled={saving || loading} onClick={() => void loadSetup()}>Reload saved setup</Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
