const fs=require('fs');const assert=require('assert');
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert(!manifest.permissions.includes('downloads'),
  'downloads permission must not be requested until Codee actually wires chrome.downloads');
for(const permission of ['storage','tabs','alarms','sidePanel','clipboardWrite']) assert(manifest.permissions.includes(permission));
console.log('manifest uses only wired permissions OK');
