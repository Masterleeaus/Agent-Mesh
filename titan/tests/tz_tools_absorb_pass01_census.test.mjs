import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const census = JSON.parse(fs.readFileSync(path.join(root, 'titan-tools', 'TOOL-CENSUS.json'), 'utf8'));

assert.equal(census.packet_id, 'TZ-TOOLS-ABSORB-001');
assert.equal(census.pass, 1);
assert.equal(census.rules.company_boundary, 'company_id');
assert.equal(census.rules.identity_does_not_grant_authority, true);
assert.ok(census.tools.length >= 35, `expected broad census, found ${census.tools.length}`);

const required = [
  'write','grammar','translate','summarize','search','webpage_assistant','text_selection',
  'chatpdf','youtube_assistant','mindmap','ai_detector','image_generate','video_generate',
  'audio_to_text','model_selection','attachments','browser_actions','crawl_extract','sheets',
  'pdf_generate_fill','docs_slides_web','custom_tools','schedules','triggers'
];
const byId = new Map(census.tools.map(tool => [tool.id, tool]));
for (const id of required) assert.ok(byId.has(id), `missing required tool census entry: ${id}`);

for (const tool of census.tools) {
  assert.ok(tool.name && tool.category && tool.status, `incomplete tool entry: ${tool.id}`);
  assert.ok(Array.isArray(tool.evidence) && tool.evidence.length > 0, `missing evidence for ${tool.id}`);
  for (const rel of tool.evidence) {
    assert.ok(fs.existsSync(path.join(root, rel)), `evidence path missing for ${tool.id}: ${rel}`);
  }
}

const retriever = JSON.parse(fs.readFileSync(path.join(root, 'retriever-capability-catalog.json'), 'utf8'));
for (const id of ['browser_actions','crawl_extract','structured_data','sheets','pdf','docs_slides_web','custom_tools','multi_tool','schedules','triggers']) {
  assert.ok(retriever.capabilities.some(cap => cap.id === id), `Retriever capability missing: ${id}`);
}

console.log(`PASS tool census: ${census.tools.length} retained tool families inventoried with evidence`);
