const fs=require('fs');const assert=require('assert');const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
assert(js.includes('Tab state:'),'Diagnostics must expose background/frozen/discarded tab state');
assert(js.includes('WAKE-RECOVERABLE'),'Diagnostics must explain frozen/discarded recovery');
assert(js.includes('Auto-discard:'),'Diagnostics must expose auto-discard protection');
console.log('sidebar background-tab diagnostics wiring OK');
