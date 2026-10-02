import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(repoRoot, "db/migrations/MANIFEST.json"), "utf8"));
const runner = path.join(repoRoot, "scripts/db-migrate.sh");

function harness(initial = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "titan-migration-runner-"));
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  const statePath = path.join(root, "state.json");
  writeFileSync(statePath, JSON.stringify({ applied: {}, appliedOrder: [], partialMigrations: {}, legacySchema: false, ...initial }));
  const fakePsql = path.join(bin, "psql");
  writeFileSync(fakePsql, `#!/usr/bin/env python3
import json, os, re, sys
state_path = os.environ['FAKE_PSQL_STATE']
state = json.load(open(state_path))
args = sys.argv[1:]
if args: args = args[1:]  # DATABASE_URL
def save():
    with open(state_path, 'w') as f: json.dump(state, f)
if '-f' in args:
    transaction = open(args[args.index('-f') + 1]).read()
    if '-- mode: seed-legacy-history' in transaction:
        if not transaction.startswith('-- mode: seed-legacy-history') or not transaction.rstrip().endswith('COMMIT;'):
            raise SystemExit('legacy seed is not wrapped in one transaction')
        inserts = []
        for line in transaction.splitlines():
            if line.startswith('INSERT INTO schema_migrations'):
                values = re.findall("'([^']+)'", line)
                if len(values) == 1 and 'NULL' in line: inserts.append(values[0])
        if not inserts: raise SystemExit('legacy seed contains no history entries')
        if os.environ.get('FAKE_PSQL_FAIL_FILENAME') in inserts:
            sys.exit(7)
        for filename in inserts: state['applied'].setdefault(filename, None)
        save()
        sys.exit(0)
    marker = re.search(r'^-- migration: ([^ ]+) sha256: ([a-f0-9]{64})$', transaction, re.M)
    if not marker: raise SystemExit('missing migration transaction marker')
    filename, checksum = marker.groups()
    if not transaction.startswith('-- migration: ') or not transaction.rstrip().endswith('COMMIT;'):
        raise SystemExit('migration SQL and ledger are not wrapped in one transaction')
    insert_line = next((line for line in transaction.splitlines() if line.startswith('INSERT INTO schema_migrations')), '')
    inserted_values = re.findall("'([^']+)'", insert_line)
    if inserted_values != [filename, checksum]:
        raise SystemExit('transaction does not record its own migration checksum')
    if filename == '088_condition_tier.sql':
        boundaries = re.findall(r'^(BEGIN|COMMIT);$', transaction, re.M)
        if boundaries != ['BEGIN', 'COMMIT']:
            raise SystemExit('migration 088 internal boundaries were not normalized')
    if filename == '089_flooring_catalog.sql':
        boundaries = re.findall(r'^(BEGIN|COMMIT);$', transaction, re.M)
        if boundaries != ['BEGIN', 'COMMIT', 'BEGIN', 'COMMIT', 'BEGIN', 'COMMIT']:
            raise SystemExit('migration 089 enum boundary was not committed before enum use')
        if os.environ.get('FAKE_PSQL_FAIL_FILENAME') == filename:
            state['partialMigrations'][filename] = 'enum-committed-before-ledger-failure'
            save()
            sys.exit(7)
    elif os.environ.get('FAKE_PSQL_FAIL_FILENAME') == filename:
        sys.exit(7)
    state['appliedOrder'].append(filename)
    state['applied'][filename] = checksum
    save()
    sys.exit(0)
query = ''
for index, arg in enumerate(args):
    if arg == '-c' or (arg.startswith('-') and arg.endswith('c')):
        query = args[index + 1]
        break
if 'SELECT filename || E' in query:
    for filename, checksum in sorted(state['applied'].items()):
        print(filename + '\\t' + (checksum or ''))
elif 'SELECT CASE' in query:
    print('seed' if not state['applied'] and state['legacySchema'] else 'migrate')
elif 'SELECT COALESCE(checksum' in query:
    filename = re.search(r"filename = '([^']+)'", query).group(1)
    value = state['applied'].get(filename)
    if value: print(value)
elif 'SELECT COUNT(*)' in query:
    filename = re.search(r"filename = '([^']+)'", query)
    print('1' if filename and filename.group(1) in state['applied'] else '0')
elif 'INSERT INTO schema_migrations' in query:
    match = re.search(r"VALUES \\('([^']+)', (NULL|'([^']+)')\\)", query)
    if not match: raise SystemExit('unrecognized insert: ' + query)
    state['applied'].setdefault(match.group(1), match.group(3) or None)
    save()
sys.exit(0)
`);
  chmodSync(fakePsql, 0o755);
  return {
    root,
    statePath,
    run({ failFilename = null } = {}) {
      return spawnSync("bash", [runner], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          DATABASE_URL: "postgresql://fixture.invalid/titan",
          FAKE_PSQL_STATE: statePath,
          ...(failFilename ? { FAKE_PSQL_FAIL_FILENAME: failFilename } : {}),
        },
      });
    },
    state() { return JSON.parse(readFileSync(statePath, "utf8")); },
    cleanup() { rmSync(root, { recursive: true, force: true }); },
  };
}

test("fresh run uses manifest order and records exact hashes; replay is idempotent", () => {
  const h = harness();
  try {
    const first = h.run();
    assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(h.state().appliedOrder, manifest.entries.map((entry) => entry.filename));
    assert.equal(Object.keys(h.state().applied).length, manifest.entries.length);
    for (const entry of manifest.entries) assert.equal(h.state().applied[entry.filename], entry.sha256);

    const second = h.run();
    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(h.state().appliedOrder, manifest.entries.map((entry) => entry.filename));
    assert.match(second.stdout, /applied filename and checksum verified/);
  } finally { h.cleanup(); }
});

test("legacy filename-only rows stay checksum-unverified while missing files follow manifest order", () => {
  const laterCollisionEntry = manifest.entries.find((entry) => entry.filename === "151_field_completion_evidence.sql");
  const h = harness({ applied: { [laterCollisionEntry.filename]: null } });
  try {
    const result = h.run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /legacy filename-only record; checksum unverified/);
    const state = h.state();
    assert.equal(state.applied[laterCollisionEntry.filename], null);
    assert.deepEqual(state.appliedOrder, manifest.entries.filter((entry) => entry.filename !== laterCollisionEntry.filename).map((entry) => entry.filename));
  } finally { h.cleanup(); }
});

test("checksum drift in an applied row fails before any migration executes", () => {
  const entry = manifest.entries.at(-1);
  const h = harness({ applied: { [entry.filename]: "0".repeat(64) } });
  try {
    const result = h.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /applied migration checksum differs/);
    assert.deepEqual(h.state().appliedOrder, []);
  } finally { h.cleanup(); }
});

test("existing schema without history remains explicitly filename-only", () => {
  const h = harness({ legacySchema: true });
  try {
    const result = h.run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /seeding legacy filename-only history/);
    assert.deepEqual(h.state().appliedOrder, []);
    assert.equal(Object.keys(h.state().applied).length, manifest.entries.length);
    assert.ok(Object.values(h.state().applied).every((checksum) => checksum === null));
  } finally { h.cleanup(); }
});

test("interrupted legacy seed leaves the ledger empty and can resume as one batch", () => {
  const entry = manifest.entries[Math.floor(manifest.entries.length / 2)];
  const h = harness({ legacySchema: true });
  try {
    const interrupted = h.run({ failFilename: entry.filename });
    assert.notEqual(interrupted.status, 0);
    assert.deepEqual(h.state().applied, {});

    const resumed = h.run();
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.equal(Object.keys(h.state().applied).length, manifest.entries.length);
    assert.ok(Object.values(h.state().applied).every((checksum) => checksum === null));
  } finally { h.cleanup(); }
});

test("failed migration transaction leaves no ledger row and can resume", () => {
  const entry = manifest.entries[0];
  const h = harness();
  try {
    const interrupted = h.run({ failFilename: entry.filename });
    assert.notEqual(interrupted.status, 0);
    assert.deepEqual(h.state().appliedOrder, []);
    assert.equal(h.state().applied[entry.filename], undefined);

    const resumed = h.run();
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.deepEqual(h.state().appliedOrder, manifest.entries.map((item) => item.filename));
    for (const item of manifest.entries) assert.equal(h.state().applied[item.filename], item.sha256);
  } finally { h.cleanup(); }
});

test("migration 089 can resume after its enum commit but before ledger commit", () => {
  const entry = manifest.entries.find((item) => item.filename === "089_flooring_catalog.sql");
  const h = harness();
  try {
    const interrupted = h.run({ failFilename: entry.filename });
    assert.notEqual(interrupted.status, 0);
    assert.equal(h.state().applied[entry.filename], undefined);
    assert.equal(h.state().partialMigrations[entry.filename], "enum-committed-before-ledger-failure");

    const resumed = h.run();
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.deepEqual(h.state().appliedOrder, manifest.entries.map((item) => item.filename));
    for (const item of manifest.entries) assert.equal(h.state().applied[item.filename], item.sha256);
  } finally { h.cleanup(); }
});
