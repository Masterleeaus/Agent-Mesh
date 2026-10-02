import * as SDK from 'titan-sdk';

const root = document.getElementById('titan-brand-studio');
const status = root?.querySelector('[role="status"]');
const text = (value) => typeof value === 'string' ? value.slice(0, 160) : '';

function summarize({ company_id, data }) {
  if (!data || data.schema !== 'titan.brand-studio.projection/v1' || data.company_id !== company_id ||
      !Array.isArray(data.surfaces) || !Array.isArray(data.publications) || data.authorityGranted !== false) {
    throw new Error('brand-studio-projection-invalid');
  }
  const attention = data.surfaces.filter((surface) =>
    ['DEGRADED', 'UNREACHABLE'].includes(surface.state) || surface.health?.capabilityDegraded === true ||
    surface.health?.staleProjection === true || surface.health?.verificationFailed === true).length;
  const pending = data.surfaces.filter((surface) => ['UNKNOWN', 'DECLARED', 'DRAFT', 'STAGED'].includes(surface.state)).length;
  const live = data.surfaces.filter((surface) => surface.state === 'LIVE').length;
  const latest = data.publications[0];
  const summary = `${data.surfaces.length} surfaces · ${live} live · ${attention} need attention · ${pending} awaiting verification`;
  return latest ? `${summary}. Latest publication: ${text(latest.status)} (${text(latest.environment)}), version ${Number.isSafeInteger(latest.version) ? latest.version : 'unknown'}.` : `${summary}. No publication supplied.`;
}

async function start() {
  if (!root || !status) return;
  try {
    const relay = await import('/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs');
    if (typeof relay.createDirectAdminRelayFetch !== 'function') throw new Error('relay-unavailable');
    const session = new SDK.DirectAdminCockpitSession(
      () => document.querySelector('meta[name="titan-directadmin-csrf"]')?.getAttribute('content') ?? '',
      relay.createDirectAdminRelayFetch(),
    );
    const mounted = SDK.mountDirectAdminProjection(session, {
      plugin_id: 'titan_web', title: 'Brand Studio', root,
      expected_schema: 'titan.brand-studio.projection/v1', summarize,
    });
    window.addEventListener('pagehide', () => { mounted.dispose(); session.dispose(); }, { once: true });
    window.addEventListener('titan-context-changed', () => { session.invalidate(); void session.connect().then(mounted.refresh).catch(() => {}); });
    await session.connect();
    await mounted.refresh();
  } catch {
    status.textContent = 'Read-only — authenticated DirectAdmin session or Brand Studio projection unavailable. No local data was substituted.';
  }
}

void start();
