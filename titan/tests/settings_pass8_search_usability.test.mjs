import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const api=require('../titan-settings-discovery.js');
const html=fs.readFileSync(new URL('../monicaOptions.html', import.meta.url),'utf8');

test('rich settings page loads additive discovery layer',()=>{
  assert.match(html,/titan-settings-discovery\.css/);
  assert.match(html,/titan-settings-discovery\.js/);
  assert.match(html,/id="root"/);
  assert.match(html,/titan-zero-chat-content\.compat\.js/);
});

test('category discovery covers core settings families',()=>{
  const labels=api.CATEGORIES.map(x=>x[1]);
  for(const label of ['Appearance','Models & Providers','Writing','Search & Research','Translation','Sidebar & Selection','Shortcuts','Privacy & Data']) assert.ok(labels.includes(label));
});

test('search ranking requires all query words and favors prefixes',()=>{
  const rows=[
    {text:'Search assistant',key:'search assistant',el:{}},
    {text:'Web search provider',key:'web search provider',el:{}},
    {text:'Writing assistant',key:'writing assistant',el:{}}
  ];
  const result=api.searchCandidates(rows,'search assistant',12);
  assert.equal(result.length,1);
  assert.equal(result[0].text,'Search assistant');
});
