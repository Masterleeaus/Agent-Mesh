import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildTitanToolLaunchMap} from '../titan-tools/tool-launch-model.mjs';
import {buildRichWorkspaceUrl} from '../titan-tools/rich-workspace-launch.mjs';

const census=JSON.parse(fs.readFileSync(new URL('../titan-tools/TOOL-CENSUS.json', import.meta.url)));
const map=buildTitanToolLaunchMap(census.tools);

test('ChatPDF and attachments use Titan rich document workspace with explicit document intent',()=>{
  for (const id of ['chatpdf','attachments']) {
    const route=map[id];
    assert.equal(route.owner,'titan-zero');
    assert.equal(route.surface,'ai_workspace');
    assert.equal(route.workspace_tab,'chat');
    assert.ok(route.document_mode);
    assert.ok(Array.isArray(route.accepted_extensions));
    assert.ok(route.accepted_extensions.includes('pdf'));
    const url=buildRichWorkspaceUrl(route);
    assert.match(url,/^chatTab\.html\?/);
    assert.match(url,/document=/);
    assert.doesNotMatch(url,/monica\.im/i);
  }
});

test('PDF generation and filling remain governed Retriever capability, not document-chat authority',()=>{
  const route=map.pdf_generate_fill;
  assert.equal(route.surface,'retriever_runtime');
  assert.equal(route.capability_id,'pdf');
  assert.equal(route.grants_execution_authority,false);
});

test('rich chat loads Titan document-mode bridge without replacing retained content runtime',()=>{
  const html=fs.readFileSync(new URL('../chatTab.html', import.meta.url),'utf8');
  assert.match(html,/titan-zero-chat-content\.compat\.js/);
  assert.match(html,/titan-document-workspace-bridge\.js/);
  const bridge=fs.readFileSync(new URL('../titan-tools/titan-document-workspace-bridge.js', import.meta.url),'utf8');
  assert.match(bridge,/titanDocumentLaunchContext/);
  assert.match(bridge,/input\[type=["']file["']\]/);
  assert.match(bridge,/titan:document-mode/);
  assert.doesNotMatch(bridge,/monica\.im/i);
});
