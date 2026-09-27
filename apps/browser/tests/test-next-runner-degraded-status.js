'use strict';
const fs=require('fs'), path=require('path');
const root=path.resolve(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'src/lib/service-worker.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'src/sidebar/sidebar.js'),'utf8');
function ok(v,m){if(!v){console.error('FAIL',m);process.exit(1)}}
ok(sw.includes('healthState:'), 'Next Runner status must expose healthState');
ok(sw.includes("'degraded'") || sw.includes('"degraded"'), 'Next Runner must represent enabled-but-unreachable as degraded');
ok(ui.includes("Degraded") || ui.includes("DEGRADED"), 'sidebar must not label an unreachable runner simply Running');
ok(ui.includes('lastResult'), 'degraded reason must remain visible');
console.log('PASS next runner degraded status contract');
