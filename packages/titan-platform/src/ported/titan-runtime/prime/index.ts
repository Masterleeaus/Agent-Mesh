// @ts-nocheck
// Ported from Titan Zero extension (portable-core): titan-runtime/prime/index.mjs
import { freezeEnvelope } from "../boundary.js";

export const RUNTIME_ID = "prime";
export const RUNTIME_NAME = "Prime Mission Runtime";
export const RUNTIME_KIND = "mission";
export const RUNTIME_PURPOSE = "Owns durable objectives, missions, checkpoints and bounded delegation; authority remains external.";
export const AUTHORITY_CONFERRED_BY_ACTIVATION = false;

export function createPrimeEnvelope(input) {
  const envelope = freezeEnvelope(input);
  return Object.freeze({ ...envelope, runtime_id: RUNTIME_ID, runtime_kind: RUNTIME_KIND, authority_conferred_by_activation: false });
}

export const runtimeDescriptor = Object.freeze({
  id: RUNTIME_ID, name: RUNTIME_NAME, kind: RUNTIME_KIND, purpose: RUNTIME_PURPOSE,
  authority_conferred_by_activation: AUTHORITY_CONFERRED_BY_ACTIVATION,
});
