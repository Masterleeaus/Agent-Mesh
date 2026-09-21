const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/sidebar/sidebar.js','utf8');
const context={console:{log(){},warn(){},error(){}},document:{addEventListener(){},getElementById(){return null;}},chrome:{runtime:{onMessage:{addListener(){}}}},Map,Promise,URL};
vm.runInNewContext(source,context);
const markdown=[
'# Production Plan',
'## Phase A',
'### Pass 1 — Rebuild & Seal RC2 Baseline',
'Deliverables:',
'- reconstruct fixes',
'- strict boolean parsing',
'- final RC2 ZIP',
'### Pass 2 — RC2 Deep Regression & Adversarial Safety',
'Test specifically:',
'- malformed booleans',
'- forged approvals',
'## Phase B',
'### Pass 3 — Durable Compilation Lifecycle',
'- every transition persists',
'- retries do not duplicate records',
'Pass 4 of 5: Dependency Readiness',
'- Risk',
'- Governance',
'Pass 5/5 — Final Certification',
'- package verification',
'- release signing'
].join('\n');
const plan=context.parsePlanText(markdown);
assert.strictEqual(plan.length,5,'explicit Pass N headings must be authoritative plan boundaries');
assert(plan[0].text.startsWith('Rebuild & Seal RC2 Baseline'));
assert(plan[0].text.includes('- strict boolean parsing'),'bullets must stay attached to Pass 1');
assert(plan[1].text.startsWith('RC2 Deep Regression & Adversarial Safety'));
assert(plan[2].text.startsWith('Durable Compilation Lifecycle'));
assert(plan[3].text.startsWith('Dependency Readiness'),'Pass N of M form must be supported');
assert(plan[4].text.startsWith('Final Certification'),'Pass N/M form must be supported');
console.log('plan parser treats Pass headings as authoritative boundaries OK');
