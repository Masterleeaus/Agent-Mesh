const fs=require('fs'); const assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8');
const js=fs.readFileSync('src/sidebar/sidebar.js','utf8');
const css=fs.readFileSync('src/sidebar/sidebar.css','utf8');
for(const id of ['prompt-search','prompt-library','skill-search','skill-library','setting-tz-enabled','setting-tz-auto-detect','setting-tz-sql','setting-tz-migrations','setting-tz-tenancy','setting-tz-navigation','setting-tz-frontend','setting-tz-max-context','setting-tz-ignore-extensions','setting-tz-parse-sql-rows']) {
 assert(new RegExp(`id=["']${id}["']`).test(html),`missing #${id}`);
}
assert(/Titan Zero/.test(html),'settings must expose Titan Zero compatibility section');
assert(/loadCapabilityLibraries/.test(js),'sidebar must load canonical prompt/skill libraries');
assert(/renderPromptLibrary/.test(js),'sidebar must render prompts');
assert(/renderSkillLibrary/.test(js),'sidebar must render skills');
assert(/titanZero/.test(js),'preferences must preserve nested Titan Zero settings');
assert(!/id=["']diagnostics-titan-zero["']/.test(html),'dedicated Titan Zero developer diagnostics card must stay removed');
assert(!/data-nav-page=["']titan-zero["']/.test(html),'must not add a top-level Titan Zero developer page');
assert(/library-card/.test(css),'prompt/skill library cards need integrated styling');
console.log('Titan Zero compatibility settings/libraries remain without developer diagnostics surface');
