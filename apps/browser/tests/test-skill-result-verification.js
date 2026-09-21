'use strict';
const assert = require('assert');
const { ModelOutputVerifier } = require('../src/intelligence/model-output-verifier');

const verifier = new ModelOutputVerifier({ now: () => 1234 });
let checks = 0;
function ok(name, fn) { fn(); checks += 1; console.log(`PASS ${name}`); }
function throws(name, fn, code) { assert.throws(fn, e => e && e.code === code); checks += 1; console.log(`PASS ${name}`); }

ok('valid structured skill result with evidence', () => {
  const out = verifier.verifySkillResult({
    request_id: 'r1', status: 'OK', result: { answer: 42 },
    evidence: [{ source: 'repository', ref: 'src/a.js:1', text: 'x', deterministic: true }]
  }, { requestId: 'r1', skillId: 'repo.answer', skillVersion: '1' });
  assert.equal(out.schema, 'titan-code-skill-result-verification/v1');
  assert.equal(out.authority, false);
  assert.equal(out.evidence[0].authority, false);
});
throws('request correlation mismatch rejected', () => verifier.verifySkillResult({ request_id: 'bad', result: {} }, { requestId: 'r2' }), 'ERR_SKILL_RESULT_CORRELATION');
throws('top-level protected authority rejected', () => verifier.verifySkillResult({ result: {}, canonical: true }), 'ERR_SKILL_RESULT_AUTHORITY');
throws('nested authority rejected', () => verifier.verifySkillResult({ result: {}, authority: { merge: true } }), 'ERR_SKILL_RESULT_AUTHORITY');
throws('evidence authority rejected', () => verifier.verifySkillResult({ result: {}, evidence: [{ source: 'repo', verified: true }] }), 'ERR_MODEL_OUTPUT_EVIDENCE_AUTHORITY');
throws('evidence without lineage rejected', () => verifier.verifySkillResult({ result: {}, evidence: [{ text: 'orphan' }] }), 'ERR_MODEL_OUTPUT_EVIDENCE');
throws('unapproved status rejected', () => verifier.verifySkillResult({ result: {}, status: 'VERIFIED' }), 'ERR_SKILL_RESULT_AUTHORITY');
ok('partial status allowed but remains advisory', () => {
  const out = verifier.verifySkillResult({ result: null, status: 'PARTIAL', evidence: [] }, { skillId: 'x' });
  assert.equal(out.status, 'PARTIAL'); assert.equal(out.verification_authority, false);
});
console.log(`PASS ${checks}/${checks} skill result verification scenarios`);
