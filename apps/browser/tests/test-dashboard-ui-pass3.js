const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const js = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');
const nav = fs.readFileSync('src/lib/navigation-registry.js', 'utf8');
const worker = fs.readFileSync('src/lib/service-worker.js', 'utf8');

assert(nav.includes("id: 'workspace.dashboard'") && nav.includes("page: 'dashboard'") && /workspace\.dashboard[^\n]+readiness: 'AVAILABLE'/.test(nav), 'Dashboard navigation must be AVAILABLE');
assert(html.includes('data-page="dashboard"'), 'Dashboard page must exist');
for (const id of ['dashboard-project-card','dashboard-plan-card','dashboard-artifact-card','dashboard-ai-card','dashboard-infrastructure-card','dashboard-workforce-card','dashboard-attention-card','dashboard-refresh-btn']) {
  assert(html.includes(`id="${id}"`), `Dashboard must contain ${id}`);
}
for (const action of ['dashboard-new-plan','dashboard-continue-plan','dashboard-analyze-repository','dashboard-ask-codee','dashboard-run-diagnostics','dashboard-open-artifact']) {
  assert(html.includes(`data-dashboard-action="${action}"`), `Dashboard quick action missing ${action}`);
}
assert(js.includes("action: 'GET_DASHBOARD_STATUS'"), 'Sidebar must request dashboard status from worker');
assert(js.includes('renderDashboardStatus'), 'Sidebar must render canonical dashboard status');
assert(js.includes('registerDashboardHandlers'), 'Sidebar must wire dashboard quick actions');
assert(js.includes('const canUseRequestedPage = navigationRegistryCache'), 'Sidebar must keep registry failure fail-closed to Runner even though Dashboard is the default page');
assert(worker.includes("'dashboard-status.js'"), 'Worker must import bounded dashboard status module');
assert(worker.includes("message.action === 'GET_DASHBOARD_STATUS'"), 'Worker must expose canonical dashboard status');
assert(worker.includes('getDashboardStatus'), 'Worker must build dashboard status from canonical sources');
assert(css.includes('.dashboard-grid'), 'Dashboard cards must use theme CSS rather than inline styles');
console.log('Dashboard UI and worker wiring are canonical and registry-owned');
