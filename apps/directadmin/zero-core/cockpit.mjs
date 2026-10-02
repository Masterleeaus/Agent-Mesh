import { mountDirectAdminProjection } from '../../../packages/titan-platform/src/directadmin-plugin.js';

export function mountZeroCore(session, root) {
  return mountDirectAdminProjection(session, {
    plugin_id: 'titan_zero', title: 'Zero Core', root, expected_schema: 'titan.zero-cockpit.v1',
    summarize({ data }) {
      if (data?.schema !== 'titan.zero-cockpit.v1') throw new Error('incompatible-zero-projection');
      return `${data.attention.length} attention items; ${data.approval_count} awaiting approval`;
    },
  });
}
