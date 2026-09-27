const fs=require('fs'); const assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8'); const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
for(const id of ['setting-repo-enabled','setting-repo-targeted-tests','setting-repo-consume-mcp','setting-repo-max-search','setting-repo-max-remote-context','setting-repo-include-extensions','setting-repo-backup-required','diagnostics-repository']) assert(new RegExp(`id=[\"']${id}[\"']`).test(html),`missing #${id}`);
assert(/Repository & Coding Intelligence/.test(html));
assert(/loadRepositoryStatus/.test(js));
assert(/repository/.test(js));
assert(!/data-nav-page=[\"']repository[\"']/.test(html),'must not add top-level repository page');
console.log('Repository existing-surface UI wiring OK');
