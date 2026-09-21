const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.css'), 'utf8');
function ok(v,m){ if(!v){ console.error('FAIL:',m); process.exit(1); } }

ok(ui.includes('async function stopAndClearPlan(tabId, event)'), 'direct Active Plans stop-and-clear handler missing');
ok(ui.includes("action: 'STOP_PLAN'"), 'direct plan stop must reuse STOP_PLAN runtime');
ok(ui.includes("button.textContent = 'Stop & Clear'"), 'normal Active Plans card Stop & Clear button missing');
ok(ui.includes("button.addEventListener('click', event => stopAndClearPlan(tabId, event))"), 'normal plan card stop control is not directly wired');
ok(ui.includes('event.stopPropagation()'), 'stop control does not isolate card click propagation');
ok(ui.includes('activePlans.delete(tabId)'), 'successful direct stop does not clear normal plan from Active Plans registry');
ok(ui.includes('if (currentTabId === numericTabId)'), 'direct stop does not clear selected plan details safely');

ok(ui.includes('async function stopAndClearNextRunner(tabId, event)'), 'direct timed Next stop-and-clear handler missing');
ok(ui.includes("action:'STOP_NEXT_RUNNER'"), 'timed Next direct stop must reuse STOP_NEXT_RUNNER runtime');
ok(ui.includes("nextButton.textContent = 'Stop & Clear'"), 'timed Next Active Plans card Stop & Clear button missing');
ok(ui.includes("nextButton.addEventListener('click', event => stopAndClearNextRunner(tabId, event))"), 'timed Next card stop control is not directly wired');
ok(ui.includes('activeNextRunners.delete(tabId)'), 'successful timed Next stop does not clear it from Active Plans registry');
ok(css.includes('.tab-item-actions'), 'Active Plans action layout CSS missing');
ok(css.includes('.tab-item-stop'), 'Active Plans stop button CSS missing');
console.log('PASS Active Plans direct Stop & Clear controls');
