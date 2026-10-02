import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./remove-workforce-service.sh', import.meta.url));

function fixture({ container = true } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'titan-workforce-remove-'));
  const bin = path.join(root, 'bin');
  const installRoot = path.join(root, 'install');
  const composePath = path.join(installRoot, 'current', 'infra', 'compose.vps.yml');
  const envPath = path.join(installRoot, 'shared', 'env', '.env');
  const logPath = path.join(root, 'docker.log');
  const statePath = path.join(root, 'container.state');
  mkdirSync(path.dirname(composePath), { recursive: true });
  mkdirSync(path.dirname(envPath), { recursive: true });
  mkdirSync(path.join(installRoot, 'shared', 'data', 'runtime'), { recursive: true });
  mkdirSync(path.join(installRoot, 'shared', 'data', 'companies', 'company-1'), { recursive: true });
  mkdirSync(path.join(installRoot, 'shared', 'keys'), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(composePath, 'name: titan-zero\nservices:\n  workforce: {}\n');
  writeFileSync(envPath, 'WORKFORCE_DIRECTADMIN_NODE_ID=fixture\n');
  writeFileSync(path.join(installRoot, 'shared', 'data', 'runtime', 'identity.db'), 'identity sentinel');
  writeFileSync(path.join(installRoot, 'shared', 'data', 'companies', 'company-1', 'workforce.db'), 'company sentinel');
  writeFileSync(path.join(installRoot, 'shared', 'keys', 'session.pub.pem'), 'public key sentinel');
  if (container) writeFileSync(statePath, 'workforce-container-id\n');

  const docker = path.join(bin, 'docker');
  writeFileSync(docker, `#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\\n' "$*" >> "$DOCKER_LOG"
case " $* " in
  *" ps --all --quiet workforce "*)
    [[ -f "$DOCKER_STATE" ]] && cat "$DOCKER_STATE" || true
    ;;
  *" rm --stop --force workforce "*)
    [[ "\${DOCKER_FAIL_ACTION:-}" != rm ]] || exit 29
    rm -f -- "$DOCKER_STATE"
    ;;
  *) echo "Unexpected Docker command: $*" >&2; exit 90;;
esac
`);
  chmodSync(docker, 0o755);
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
    DOCKER_LOG: logPath,
    DOCKER_STATE: statePath,
  };
  return { root, installRoot, envPath, composePath, logPath, statePath, env };
}

function run(f, args = [], extraEnv = {}) {
  return spawnSync('bash', [scriptPath, '--install-root', f.installRoot, ...args], {
    encoding: 'utf8',
    env: { ...f.env, ...extraEnv },
  });
}

test('removes only Workforce and repeated removal is a no-op with shared data intact', (t) => {
  const f = fixture();
  t.after(() => rmSync(f.root, { recursive: true, force: true }));

  const first = run(f);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Removed the Workforce service container/);
  assert.equal(existsSync(f.statePath), false);

  const second = run(f);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already absent/);
  const commands = readFileSync(f.logPath, 'utf8').trim().split('\n');
  assert.equal(commands.length, 3, commands.join('\n'));
  assert.match(commands[0], / ps --all --quiet workforce$/);
  assert.match(commands[1], / rm --stop --force workforce$/);
  assert.match(commands[2], / ps --all --quiet workforce$/);
  assert.doesNotMatch(readFileSync(f.logPath, 'utf8'), /(^|\s)(down|-v|--volumes|--rmi)(\s|$)/);

  assert.equal(readFileSync(path.join(f.installRoot, 'shared', 'data', 'runtime', 'identity.db'), 'utf8'), 'identity sentinel');
  assert.equal(readFileSync(path.join(f.installRoot, 'shared', 'data', 'companies', 'company-1', 'workforce.db'), 'utf8'), 'company sentinel');
  assert.equal(readFileSync(path.join(f.installRoot, 'shared', 'keys', 'session.pub.pem'), 'utf8'), 'public key sentinel');
  assert.equal(readFileSync(f.envPath, 'utf8'), 'WORKFORCE_DIRECTADMIN_NODE_ID=fixture\n');
  assert.equal(readFileSync(f.composePath, 'utf8'), 'name: titan-zero\nservices:\n  workforce: {}\n');
});

test('does not invoke container removal when Workforce is already absent', (t) => {
  const f = fixture({ container: false });
  t.after(() => rmSync(f.root, { recursive: true, force: true }));

  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /already absent/);
  const commands = readFileSync(f.logPath, 'utf8').trim().split('\n');
  assert.equal(commands.length, 1);
  assert.match(commands[0], / ps --all --quiet workforce$/);
});

test('propagates Docker removal failure and leaves persisted data untouched', (t) => {
  const f = fixture();
  t.after(() => rmSync(f.root, { recursive: true, force: true }));

  const result = run(f, [], { DOCKER_FAIL_ACTION: 'rm' });
  assert.equal(result.status, 29);
  assert.equal(existsSync(f.statePath), true);
  assert.equal(readFileSync(path.join(f.installRoot, 'shared', 'data', 'runtime', 'identity.db'), 'utf8'), 'identity sentinel');
});

test('fails closed when install metadata is missing', (t) => {
  const f = fixture();
  t.after(() => rmSync(f.root, { recursive: true, force: true }));
  rmSync(f.composePath);

  const result = run(f);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Compose file not found/);
  assert.equal(existsSync(f.logPath), false);
});

test('rejects unsupported arguments', (t) => {
  const f = fixture();
  t.after(() => rmSync(f.root, { recursive: true, force: true }));

  const result = run(f, ['--delete-volumes']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown argument/);
  assert.equal(existsSync(f.logPath), false);
});

test('installer usage text does not mutate the host', () => {
  const output = execFileSync('bash', [scriptPath, '--help'], { encoding: 'utf8' });
  assert.match(output, /remove only the Workforce Compose service container/);
});

test('rejects an empty install root from the environment', () => {
  const result = spawnSync('bash', [scriptPath], {
    encoding: 'utf8',
    env: { ...process.env, TITAN_ZERO_INSTALL_ROOT: '' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Install root must be an absolute path/);
});
