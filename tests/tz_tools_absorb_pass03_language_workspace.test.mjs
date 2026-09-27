import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {buildTitanToolLaunchMap, resolveTitanToolLaunch} from '../titan-tools/tool-launch-model.mjs';
import {buildRichWorkspaceUrl, createAiWorkspaceAdapter} from '../titan-tools/rich-workspace-launch.mjs';

const census = JSON.parse(fs.readFileSync(new URL('../titan-tools/TOOL-CENSUS.json', import.meta.url), 'utf8'));
const map = buildTitanToolLaunchMap(census.tools);

const expected = {
  write: ['write', 'write'],
  rewrite: ['write', 'rewrite'],
  grammar: ['write', 'grammar'],
  translate: ['translate', 'translate'],
  summarize: ['reading', 'summarize'],
  read: ['reading', 'read'],
};

test('writing and language tools resolve to native retained rich-workspace tabs', () => {
  for (const [id, [tab, action]] of Object.entries(expected)) {
    const route = resolveTitanToolLaunch(id, map);
    assert.equal(route.surface, 'ai_workspace');
    assert.equal(route.entrypoint, 'chatTab.html');
    assert.equal(route.workspace_tab, tab);
    assert.equal(route.workspace_action, action);
    assert.equal(route.launch_url, `chatTab.html?tab=${tab}&action=${action}&source=titan-tools`);
  }
});

test('rich workspace URL builder never falls back to donor pages', () => {
  const route = resolveTitanToolLaunch('grammar', map);
  const url = buildRichWorkspaceUrl(route);
  assert.equal(url, 'chatTab.html?tab=write&action=grammar&source=titan-tools');
  assert.ok(!/monica/i.test(url));
});

test('AI workspace adapter opens the exact Titan-owned rich workspace URL', async () => {
  const opened = [];
  const adapter = createAiWorkspaceAdapter({openUrl: async url => { opened.push(url); return {ok:true}; }});
  const route = resolveTitanToolLaunch('translate', map);
  const result = await adapter(route);
  assert.deepEqual(opened, ['chatTab.html?tab=translate&action=translate&source=titan-tools']);
  assert.equal(result.ok, true);
  assert.equal(result.tool_id, 'translate');
});

test('retained rich workspace parser still supports write translate reading tabs and action params', () => {
  const content = fs.readFileSync(new URL('../titan-zero-chat-content.compat.js', import.meta.url), 'utf8');
  assert.match(content, /\["chat","bots","search","write","artist","translate","memo","reading","toolkit"/);
  assert.match(content, /action:m\.get\("action"\)\|\|void 0/);
  assert.match(content, /if\(s&&r\.includes\(s\)\)return\{\.\.\.p,tab:s\}/);
});
