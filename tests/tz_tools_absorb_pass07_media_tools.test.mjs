import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildTitanToolLaunchMap} from '../titan-tools/tool-launch-model.mjs';

const map = JSON.parse(fs.readFileSync('titan-tools/TOOL-LAUNCH-MAP.json','utf8'));
const routes = map.routes;

const expected = {
  podcast: ['audio','podcast'],
  audio_to_text: ['audio','audio-to-text'],
  image_generate: ['image','image-generate'],
  image_edit: ['image','image-edit'],
  image_realtime: ['image','image-realtime'],
  image_restore_transform: ['image','image-transform'],
  video_generate: ['video','video-generate'],
  text_to_video: ['video','text-to-video'],
  image_to_video: ['video','image-to-video'],
};

test('Pass 7 media tools resolve to explicit rich Titan media workspaces', () => {
  for (const [id,[tab,mode]] of Object.entries(expected)) {
    const r = routes[id];
    assert.ok(r, `missing ${id}`);
    assert.equal(r.owner,'titan-zero');
    assert.equal(r.surface,'ai_workspace');
    assert.equal(r.entrypoint,'chatTab.html');
    assert.equal(r.workspace_tab,tab);
    assert.equal(r.media_mode,mode);
    assert.equal(r.donor_navigation,false);
    assert.match(r.launch_url, new RegExp(`tab=${tab}`));
    assert.match(r.launch_url, new RegExp(`media=${mode}`));
  }
});


test('dynamic Titan launch model preserves media workspace intent', () => {
  const census = JSON.parse(fs.readFileSync('titan-tools/TOOL-CENSUS.json','utf8'));
  const dynamic = {routes: buildTitanToolLaunchMap(census.tools)};
  for (const [id,[tab,mode]] of Object.entries(expected)) {
    const r = dynamic.routes[id];
    assert.equal(r.workspace_tab, tab, `${id} dynamic tab`);
    assert.equal(r.media_mode, mode, `${id} dynamic media mode`);
    assert.match(r.launch_url, new RegExp(`media=${mode}`));
  }
});

test('rich chat loads Titan media workspace bridge', () => {
  const html = fs.readFileSync('chatTab.html','utf8');
  assert.match(html,/titan-tools\/titan-media-workspace-bridge\.js/);
  const bridge = fs.readFileSync('titan-tools/titan-media-workspace-bridge.js','utf8');
  for (const term of ['image-generate','image-edit','image-realtime','image-transform','video-generate','text-to-video','image-to-video','audio-to-text','podcast']) {
    assert.ok(bridge.includes(term), `bridge missing ${term}`);
  }
  assert.match(bridge,/MutationObserver/);
  assert.match(bridge,/data-titan-media-mode/);
});

test('retained rich runtime still contains native media feature evidence', () => {
  const bundle = fs.readFileSync('packages/titan-platform/src/ported/titan-zero-chat-content.compat.ts','utf8');
  for (const term of ['AI Image Generator','AI Video Generator','Audio to Text','AI Podcast Generator','textToVideo','imageToVideo']) {
    assert.ok(bundle.includes(term), `retained runtime missing ${term}`);
  }
});
