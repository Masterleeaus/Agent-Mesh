import { mountDirectAdminProjection } from '../../../packages/titan-platform/src/directadmin-plugin.js';
import { summarizeBrandStudioProjection } from '../../../packages/titan-platform/src/brand-publication.js';

export function mountBrandStudio(session, root) {
  return mountDirectAdminProjection(session, {
    plugin_id: 'titan_web', title: 'Brand Studio', root, expected_schema: 'titan.brand-studio.projection/v1',
    summarize: ({ company_id, data }) => summarizeBrandStudioProjection(data, company_id),
  });
}
