export type EnvironmentalKind = 'energy' | 'water' | 'waste' | 'chemical' | 'emissions' | 'incident' | 'opportunity';
export type EnvironmentalObservation = { company_id: string; observation_id: string; kind: EnvironmentalKind; value: number; unit: string; period_start: string; period_end: string; source_ref: string; provenance_ref: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; verified: boolean };
export type NormalizedObservation = EnvironmentalObservation & { normalized_value: number; normalized_unit: string };

const conversions: Record<string, { unit: string; factor: number }> = { kwh: { unit: 'kwh', factor: 1 }, mwh: { unit: 'kwh', factor: 1000 }, l: { unit: 'l', factor: 1 }, m3: { unit: 'l', factor: 1000 }, kg: { unit: 'kg', factor: 1 }, t: { unit: 'kg', factor: 1000 } };

export function normalizeEnvironmentalObservation(observation: EnvironmentalObservation): NormalizedObservation {
  if (!observation.company_id.trim() || !observation.observation_id.trim()) throw new Error('environmental_identity_required');
  if (!observation.source_ref.trim() || !observation.provenance_ref.trim()) throw new Error('environmental_provenance_required');
  if (!Number.isFinite(observation.value) || observation.value < 0) throw new Error('environmental_value_invalid');
  const conversion = conversions[observation.unit.toLowerCase()];
  if (!conversion) throw new Error('environmental_unit_unsupported');
  return { ...observation, normalized_value: observation.value * conversion.factor, normalized_unit: conversion.unit };
}

