import { describe, expect, it } from "vitest";
import { normalizeEnvironmentalObservation } from "./environmental";

const observation = { company_id: "a", observation_id: "energy-1", kind: "energy" as const, value: 2, unit: "mwh", period_start: "2026-09-01", period_end: "2026-09-30", source_ref: "meter-1", provenance_ref: "evidence-1", confidence: "HIGH" as const, verified: true };

describe("environmental capability pack", () => {
  it("normalizes supported units while preserving provenance", () => expect(normalizeEnvironmentalObservation(observation)).toMatchObject({ normalized_value: 2000, normalized_unit: "kwh", source_ref: "meter-1", provenance_ref: "evidence-1" }));
  it("rejects unsupported units and provenance-free claims", () => {
    expect(() => normalizeEnvironmentalObservation({ ...observation, unit: "unknown" })).toThrow("environmental_unit_unsupported");
    expect(() => normalizeEnvironmentalObservation({ ...observation, provenance_ref: "" })).toThrow("environmental_provenance_required");
  });
});

