'use strict';
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8');
const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
assert(html.includes('diagnostics-runner'),'Diagnostics UI must expose Plan Runner Deep Diagnostics');
assert(js.includes('formatDiagnosticRunner'),'sidebar must format runner deep diagnostics');
assert(js.includes('Plan inventory:'),'clipboard diagnostics must include plan inventory');
assert(js.includes('Failure summary:'),'clipboard diagnostics must include failure summary');
console.log('Titan Code deep diagnostics UI coverage OK');
