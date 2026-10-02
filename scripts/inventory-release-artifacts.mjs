#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { inventoryReleaseArtifacts } from '../packages/deployment/release-candidate.mjs';

try {
  const [requestPath, artifactRoot, ...extra] = process.argv.slice(2);
  if (!requestPath || !artifactRoot || extra.length) {
    throw new Error('Usage: node scripts/inventory-release-artifacts.mjs <inventory-request.json> <artifact-root>');
  }
  if ((await stat(requestPath)).size > 1_000_000) throw new Error('release-inventory:request-too-large');
  const request = JSON.parse(await readFile(requestPath, 'utf8'));
  if (!request || typeof request !== 'object' || Array.isArray(request) ||
      request.schema !== 'titan.deployment.release-artifact-inventory-request.v1') {
    throw new Error('release-inventory:request-schema-invalid');
  }
  const allowed = new Set(['schema', 'source_sha', 'profile', 'artifacts']);
  if (Object.keys(request).some(key => !allowed.has(key))) {
    throw new Error('release-inventory:request-field-invalid');
  }
  const inventory = await inventoryReleaseArtifacts({
    artifactRoot,
    source_sha: request.source_sha,
    profile: request.profile,
    artifacts: request.artifacts,
  });
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
