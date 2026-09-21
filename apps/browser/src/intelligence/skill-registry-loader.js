'use strict';

const Manifest = require('./skill-manifest-contract');
const Boundary = require('./skill-runtime-boundary');

const SKILL_REGISTRY_SCHEMA = 'titan-code-skill-registry/v1';
const SKILL_LOAD_RESULT_SCHEMA = 'titan-code-skill-load-result/v1';
const DEFAULT_MAX_SKILLS = 128;
const HARD_MAX_SKILLS = 512;

function boundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach(child => deepFreeze(child, seen));
  return Object.freeze(value);
}

function stableSort(items) {
  return items.slice().sort((a, b) => {
    const byId = String(a.id).localeCompare(String(b.id));
    if (byId) return byId;
    return String(a.version).localeCompare(String(b.version));
  });
}

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details) error.details = details;
  throw error;
}

class SkillRegistryLoader {
  constructor(options = {}) {
    Boundary.assertNoAuthorityEscalation(options);
    this.maxSkills = boundedInt(options.maxSkills, DEFAULT_MAX_SKILLS, 1, HARD_MAX_SKILLS);
    this.requireExecutable = options.requireExecutable !== false;
    this._records = new Map();
  }

  _key(manifest) {
    return `${manifest.id}@${manifest.version}`;
  }

  validate(manifestInput, callerGrant = {}) {
    const manifest = Manifest.normalizeManifest(manifestInput);
    const evaluation = Manifest.evaluatePermissions(manifest, callerGrant);
    if (this.requireExecutable && !evaluation.executable) {
      fail('ERR_SKILL_LOAD_PERMISSION_DENIED', 'skill failed permission/capability validation', {
        skill_id: manifest.id,
        skill_version: manifest.version,
        denied: evaluation.denied.slice(),
      });
    }
    return deepFreeze({ manifest, evaluation });
  }

  load(manifestInput, callerGrant = {}, metadata = {}) {
    Boundary.assertNoAuthorityEscalation(metadata);
    if (this._records.size >= this.maxSkills) {
      fail('ERR_SKILL_REGISTRY_LIMIT', 'skill registry limit reached', { max_skills: this.maxSkills });
    }
    const validated = this.validate(manifestInput, callerGrant);
    const key = this._key(validated.manifest);
    if (this._records.has(key)) {
      fail('ERR_SKILL_REGISTRY_DUPLICATE', 'duplicate skill id/version', {
        skill_id: validated.manifest.id,
        skill_version: validated.manifest.version,
      });
    }
    const record = deepFreeze({
      schema: SKILL_LOAD_RESULT_SCHEMA,
      id: validated.manifest.id,
      version: validated.manifest.version,
      manifest: validated.manifest,
      permission_evaluation: validated.evaluation,
      source: String(metadata.source || 'direct').slice(0, 160),
      deterministic: true,
      loaded: true,
      executable: validated.evaluation.executable,
      catalogs_are_descriptors_not_executors: true,
      authority: { ...Boundary.PROTECTED_AUTHORITY },
    });
    this._records.set(key, record);
    return record;
  }

  loadMany(manifestInputs, callerGrant = {}, metadata = {}) {
    if (!Array.isArray(manifestInputs)) {
      fail('ERR_SKILL_REGISTRY_INPUT', 'skill manifest list must be an array');
    }
    if (manifestInputs.length > this.maxSkills - this._records.size) {
      fail('ERR_SKILL_REGISTRY_LIMIT', 'skill registry input exceeds remaining capacity', {
        max_skills: this.maxSkills,
        existing: this._records.size,
        incoming: manifestInputs.length,
      });
    }

    // Validate the entire batch first so partial loads cannot occur on later failure.
    const validated = manifestInputs.map(input => this.validate(input, callerGrant));
    const batchKeys = new Set();
    for (const item of validated) {
      const key = this._key(item.manifest);
      if (batchKeys.has(key) || this._records.has(key)) {
        fail('ERR_SKILL_REGISTRY_DUPLICATE', 'duplicate skill id/version', {
          skill_id: item.manifest.id,
          skill_version: item.manifest.version,
        });
      }
      batchKeys.add(key);
    }

    const sorted = stableSort(validated.map(item => item.manifest));
    const byKey = new Map(validated.map(item => [this._key(item.manifest), item]));
    const results = [];
    for (const manifest of sorted) {
      const item = byKey.get(this._key(manifest));
      const record = deepFreeze({
        schema: SKILL_LOAD_RESULT_SCHEMA,
        id: item.manifest.id,
        version: item.manifest.version,
        manifest: item.manifest,
        permission_evaluation: item.evaluation,
        source: String(metadata.source || 'batch').slice(0, 160),
        deterministic: true,
        loaded: true,
        executable: item.evaluation.executable,
        catalogs_are_descriptors_not_executors: true,
        authority: { ...Boundary.PROTECTED_AUTHORITY },
      });
      this._records.set(this._key(item.manifest), record);
      results.push(record);
    }
    return deepFreeze(results);
  }

  get(id, version = '1') {
    const normalized = Manifest.normalizeManifest({ id, version });
    return this._records.get(this._key(normalized)) || null;
  }

  list() {
    return deepFreeze(stableSort(Array.from(this._records.values())));
  }

  snapshot() {
    return deepFreeze({
      schema: SKILL_REGISTRY_SCHEMA,
      max_skills: this.maxSkills,
      count: this._records.size,
      deterministic: true,
      fail_closed: true,
      records: this.list(),
      authority: { ...Boundary.PROTECTED_AUTHORITY },
    });
  }

  clear() {
    this._records.clear();
  }
}

module.exports = {
  DEFAULT_MAX_SKILLS,
  HARD_MAX_SKILLS,
  SKILL_LOAD_RESULT_SCHEMA,
  SKILL_REGISTRY_SCHEMA,
  SkillRegistryLoader,
};
