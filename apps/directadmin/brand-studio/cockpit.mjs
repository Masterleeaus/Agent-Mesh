import { mountDirectAdminProjection } from '../../../packages/titan-platform/src/directadmin-plugin.js';

export function mountBrandStudio(session, root) {
  return mountDirectAdminProjection(session, {
    plugin_id: 'titan_web', title: 'Brand Studio', root, expected_schema: 'titan.brand-publication.v1',
    summarize({ data }) {
      if (data?.schema !== 'titan.brand-publication.v1') throw new Error('incompatible-brand-projection');
      return `Publication ${data.publication_id}: ${data.status} (${data.environment}), version ${data.version}`;
    },
  });
}
