'use strict';

const MAX_TEXT_CHARS = 128 * 1024;
const MAX_EVIDENCE_ITEMS = 64;
const MAX_EVIDENCE_TEXT_CHARS = 16 * 1024;
const AUTHORITY_FLAGS = [
  'authority','canonical','plan_advance','mutation_authorized','verified','approved','execution_authorized','merge_authorized','baseline_authorized',
  'promotion_authority','memory_authority','memory_promoted','memory_rejected',
  'verification_authority','execution_authority','canonical_authority','mutation_authority','plan_authority',
  'merge_authority','baseline_authority','repository_write_authority','shell_authority','database_mutation_authority',
  'browser_permission_authority','spend_policy_authority','memory_promotion_authority','skill_permission_escalation'
];

function verifierError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function clampConfidence(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function normalizeEvidence(evidence) {
  if (evidence == null) return [];
  if (!Array.isArray(evidence)) throw verifierError('ERR_MODEL_OUTPUT_EVIDENCE', 'evidence must be an array');
  if (evidence.length > MAX_EVIDENCE_ITEMS) throw verifierError('ERR_MODEL_OUTPUT_EVIDENCE', `evidence exceeds ${MAX_EVIDENCE_ITEMS} items`);
  return evidence.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw verifierError('ERR_MODEL_OUTPUT_EVIDENCE', 'evidence item must be an object', { index });
    }
    const source = typeof item.source === 'string' ? item.source.trim().slice(0, 160) : '';
    const ref = typeof item.ref === 'string' ? item.ref.trim().slice(0, 240) : '';
    const text = typeof item.text === 'string' ? item.text.slice(0, MAX_EVIDENCE_TEXT_CHARS) : '';
    const deterministic = item.deterministic === true;
    if (!source && !ref) throw verifierError('ERR_MODEL_OUTPUT_EVIDENCE', 'evidence item requires source or ref', { index });
    if (item.authority === true || item.canonical === true || item.verified === true || item.approved === true) {
      throw verifierError('ERR_MODEL_OUTPUT_EVIDENCE_AUTHORITY', 'evidence item attempted to claim authority', { index });
    }
    return Object.freeze({ source: source || null, ref: ref || null, text, deterministic, advisory_only: true, authority: false });
  });
}

function scanAuthorityClaims(response) {
  const claims = [];
  const protectedStatuses = new Set(['VERIFIED','APPROVED','CANONICAL','PROMOTED','REJECTED']);
  const seen = new WeakSet();
  let visited = 0;
  const MAX_VISITED = 4096;
  const MAX_DEPTH = 24;

  function walk(value, path, depth, authorityContainer) {
    if (!value || typeof value !== 'object' || depth > MAX_DEPTH || visited >= MAX_VISITED) return;
    if (seen.has(value)) return;
    seen.add(value);
    visited += 1;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length && visited < MAX_VISITED; i += 1) walk(value[i], `${path}[${i}]`, depth + 1, authorityContainer);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;
      if (child === true && (AUTHORITY_FLAGS.includes(key) || authorityContainer === true)) claims.push(childPath);
      if (key === 'status' && typeof child === 'string' && protectedStatuses.has(child)) claims.push(`${childPath}:${child}`);
      if (key === 'evidence') continue; // normalizeEvidence owns evidence-specific authority/error semantics.
      if (child && typeof child === 'object') walk(child, childPath, depth + 1, authorityContainer || key === 'authority');
      if (visited >= MAX_VISITED) break;
    }
  }

  walk(response, '', 0, false);
  return claims;
}

class ModelOutputVerifier {
  constructor({ now } = {}) {
    this.now = typeof now === 'function' ? now : () => Date.now();
  }

  verify(response, { requestId, expectedModel = null, source = 'browser-local' } = {}) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      throw verifierError('ERR_MODEL_OUTPUT_STRUCTURE', 'model output must be an object');
    }
    if (requestId && response.request_id && response.request_id !== requestId) {
      throw verifierError('ERR_MODEL_OUTPUT_CORRELATION', 'model output request_id does not match request');
    }
    const claims = scanAuthorityClaims(response);
    if (claims.length) {
      throw verifierError('ERR_MODEL_OUTPUT_AUTHORITY', 'model output attempted to claim protected authority', { claims });
    }
    if (typeof response.text !== 'string') {
      throw verifierError('ERR_MODEL_OUTPUT_TEXT', 'model output must contain text');
    }
    if (response.text.length > MAX_TEXT_CHARS) {
      throw verifierError('ERR_MODEL_OUTPUT_TEXT', `model output exceeds ${MAX_TEXT_CHARS} characters`);
    }
    const confidence = clampConfidence(response.confidence);
    return Object.freeze({
      schema: 'titan-code-model-output-verification/v1',
      request_id: requestId || response.request_id || null,
      verified_at: this.now(),
      source,
      model: typeof response.model === 'string' ? response.model : expectedModel,
      confidence,
      structural_valid: true,
      advisory_only: true,
      authority: false,
      verification_authority: false,
      execution_authority: false,
      canonical_authority: false,
      text: response.text,
      finish_reason: typeof response.finish_reason === 'string' ? response.finish_reason : null,
      usage: clone(response.usage) || null,
      runtime: clone(response.runtime) || null,
      metadata: clone(response.metadata) || {},
    });
  }

  verifySkillResult(response, { requestId, skillId, skillVersion = '1', source = 'skill-runtime' } = {}) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      throw verifierError('ERR_SKILL_RESULT_STRUCTURE', 'skill result must be an object');
    }
    if (requestId && response.request_id && response.request_id !== requestId) {
      throw verifierError('ERR_SKILL_RESULT_CORRELATION', 'skill result request_id does not match request');
    }
    const claims = scanAuthorityClaims(response);
    if (claims.length) {
      throw verifierError('ERR_SKILL_RESULT_AUTHORITY', 'skill result attempted to claim protected authority', { claims });
    }
    if (response.authority && typeof response.authority === 'object') {
      const nested = Object.entries(response.authority).filter(([, value]) => value === true).map(([key]) => `authority.${key}`);
      if (nested.length) throw verifierError('ERR_SKILL_RESULT_AUTHORITY', 'skill result nested authority claims are forbidden', { claims: nested });
    }
    const evidence = normalizeEvidence(response.evidence);
    const status = typeof response.status === 'string' ? response.status : 'OK';
    if (!['OK', 'PARTIAL', 'NO_RESULT'].includes(status)) {
      throw verifierError('ERR_SKILL_RESULT_STATUS', 'skill result status is not allowed');
    }
    const result = clone(response.result);
    return Object.freeze({
      schema: 'titan-code-skill-result-verification/v1',
      request_id: requestId || response.request_id || null,
      verified_at: this.now(),
      source,
      skill_id: skillId || response.skill_id || null,
      skill_version: String(skillVersion || response.skill_version || '1'),
      status,
      structural_valid: true,
      evidence_valid: true,
      evidence,
      result,
      advisory_only: true,
      authority: false,
      verification_authority: false,
      execution_authority: false,
      canonical_authority: false,
      mutation_authority: false,
      plan_authority: false,
      metadata: clone(response.metadata) || {},
    });
  }
}

module.exports = { AUTHORITY_FLAGS, MAX_TEXT_CHARS, MAX_EVIDENCE_ITEMS, MAX_EVIDENCE_TEXT_CHARS, ModelOutputVerifier, normalizeEvidence, scanAuthorityClaims };
