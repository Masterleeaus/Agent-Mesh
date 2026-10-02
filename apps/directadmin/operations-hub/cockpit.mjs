import { mountDirectAdminProjection } from '../../../packages/titan-platform/src/directadmin-plugin.js';

export function mountOperationsHub(session, root) {
  return mountDirectAdminProjection(session, {
    plugin_id: 'titan_operations', title: 'Operations Hub', root, expected_schema: 'titan.operations-health.v1',
    summarize({ data }) {
      if (data?.schema !== 'titan.operations-health.v1') throw new Error('incompatible-operations-projection');
      return `${data.nodes.length} observed nodes; ${data.remediations.length} suggested governed remediations`;
    },
  });
}
