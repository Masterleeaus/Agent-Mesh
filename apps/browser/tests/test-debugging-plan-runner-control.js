const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8');
const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
assert(html.includes('id="debugging-plan-mode"'), 'runner must expose a Debugging Plan mode control');
assert(/debuggingPlanEnabled\s*:\s*Boolean\(/.test(js), 'new plan state must persist Debugging Plan mode');
console.log('debugging plan runner control OK');
