const fs=require('fs'); const assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8'); const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
for(const id of ['setting-repo-enabled','setting-repo-targeted-tests','setting-repo-consume-mcp','setting-repo-max-search','setting-repo-max-remote-context','setting-repo-include-extensions','setting-repo-backup-required']) assert(new RegExp(`id=["']${id}["']`).test(html),`missing compatibility setting #${id}`);
assert(/Repository & Coding Intelligence/.test(html),'compatibility settings group must remain while repository adapter exists');
assert(/loadRepositoryStatus/.test(js),'repository compatibility status loader must remain');
assert(!/id=["']diagnostics-repository["']/.test(html),'dedicated repository diagnostics card must stay removed from Browser Node product surface');
assert(!/data-nav-page=["']repository["']/.test(html),'must not add top-level repository page');
console.log('Repository compatibility settings remain hidden from primary navigation and dedicated diagnostics');
