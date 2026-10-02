#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { verifyReleaseCandidate } from '../packages/deployment/release-candidate.mjs';

try {
  const [manifestPath, artifactRoot, keyPath, ...extra] = process.argv.slice(2);
  if (!manifestPath || !artifactRoot || !keyPath || extra.length) {
    throw new Error('Usage: node scripts/verify-release-candidate.mjs <signed-envelope.json> <artifact-root> <trusted-ed25519-public-key.pem>');
  }
  if ((await stat(manifestPath)).size > 4_000_000) throw new Error('release-candidate:envelope-too-large');
  const envelope = JSON.parse(await readFile(manifestPath, 'utf8'));
  const publicKey = await readFile(keyPath, 'utf8');
  const result = await verifyReleaseCandidate({ envelope, publicKey, artifactRoot });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
