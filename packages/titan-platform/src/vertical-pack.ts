export type VerticalPackState = "staged" | "installed" | "disabled" | "retired" | "incompatible";
export type VerticalPack = Readonly<{
  schema: "titan.sprout.vertical-pack.v1";
  pack_id: string;
  version: string;
  label: string;
  state: VerticalPackState;
  company_id: string;
  required_capabilities: readonly string[];
  standards_pack_id: string | null;
  promoted_evidence_refs: readonly string[];
}>;

function required(value: unknown, field: string): string { const result = String(value ?? "").trim(); if (!result) throw new Error(`${field} is required`); return result; }
function clone<T>(value: T): T { return structuredClone(value); }

export function createVerticalPack(input: Partial<VerticalPack> & { pack_id: string; version: string; label: string; company_id: string }): VerticalPack {
  return Object.freeze({
    schema: "titan.sprout.vertical-pack.v1", pack_id: required(input.pack_id, "pack_id"), version: required(input.version, "version"), label: required(input.label, "label"), company_id: required(input.company_id, "company_id"), state: input.state ?? "staged",
    required_capabilities: Object.freeze([...(input.required_capabilities ?? [])].map((id) => required(id, "required_capability"))),
    standards_pack_id: input.standards_pack_id ? required(input.standards_pack_id, "standards_pack_id") : null,
    promoted_evidence_refs: Object.freeze([...(input.promoted_evidence_refs ?? [])].map((id) => required(id, "evidence_ref"))),
  });
}

export class VerticalPackStore {
  #company_id: string;
  #packs = new Map<string, VerticalPack>();
  #permanentEvidence = new Set<string>();
  constructor(company_id: string, permanentEvidenceRefs: readonly string[] = []) { this.#company_id = required(company_id, "company_id"); permanentEvidenceRefs.forEach((ref) => this.#permanentEvidence.add(required(ref, "evidence_ref"))); }
  get packs(): readonly VerticalPack[] { return Object.freeze([...this.#packs.values()].map(clone)); }
  preview(pack: VerticalPack): VerticalPack { this.assertCompany(pack); if (this.#packs.has(pack.pack_id) && this.#packs.get(pack.pack_id)?.version === pack.version) throw new Error("vertical-pack-version-already-installed"); return Object.freeze({ ...pack, state: "staged" }); }
  install(pack: VerticalPack): VerticalPack { const staged = this.preview(pack); const installed = Object.freeze({ ...staged, state: "installed" as const }); this.#packs.set(installed.pack_id, installed); return installed; }
  upgrade(pack: VerticalPack): VerticalPack { this.assertCompany(pack); const previous = this.#packs.get(pack.pack_id); if (!previous || previous.state === "retired") throw new Error("vertical-pack-upgrade-target-missing"); if (previous.version === pack.version) throw new Error("vertical-pack-version-already-installed"); const upgraded = Object.freeze({ ...pack, state: "installed" as const }); this.#packs.set(upgraded.pack_id, upgraded); return upgraded; }
  disable(pack_id: string): VerticalPack { const pack = this.get(pack_id); const next = Object.freeze({ ...pack, state: "disabled" as const }); this.#packs.set(pack_id, next); return next; }
  retire(pack_id: string): VerticalPack { const pack = this.get(pack_id); const next = Object.freeze({ ...pack, state: "retired" as const, promoted_evidence_refs: Object.freeze([...pack.promoted_evidence_refs]) }); this.#packs.set(pack_id, next); return next; }
  hasPermanentEvidence(ref: string): boolean { return this.#permanentEvidence.has(ref); }
  private get(pack_id: string): VerticalPack { const pack = this.#packs.get(required(pack_id, "pack_id")); if (!pack) throw new Error("vertical-pack-not-installed"); return pack; }
  private assertCompany(pack: VerticalPack): void { if (pack.company_id !== this.#company_id) throw new Error("vertical-pack-company-context-mismatch"); }
}

