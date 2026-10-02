import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";

const root = path.dirname(fileURLToPath(import.meta.url));
function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [script, ...args]);
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}
async function unusedPort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

// The fixture supervisor starts real Node processes. The production updater
// performs real file operations and HTTP probes; only systemd is substituted.
async function fixture(t, behavior = "healthy") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "titan-node-lifecycle-"));
  const source = path.join(dir, "source");
  const installed = path.join(dir, "usr/local/titan/server-node");
  const unit = path.join(dir, "etc/systemd/system/titan-server-node.service");
  const backups = path.join(dir, "usr/local/titan/server-node-backups");
  const config = path.join(dir, "etc/titan/server-node.env");
  const store = path.join(dir, "var/lib/titan/server-node/control.json");
  const pidFile = path.join(dir, "service.pid");
  const log = path.join(dir, "supervisor.log");
  const port = await unusedPort();
  for (const target of [source, installed, path.dirname(unit), path.dirname(config), path.dirname(store)]) fs.mkdirSync(target, { recursive: true });
  const runtime = (version, good) => `import http from "node:http";
const version = ${JSON.stringify(version)};
const server = http.createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ ok: ${good}, service: "titan-server-node", pid: process.pid + ${version === "new" && behavior === "wrong-pid" ? 1 : 0}, version })); });
server.listen(Number(process.env.TITAN_NODE_PORT), "127.0.0.1");
process.once("SIGTERM", () => server.close(() => process.exit(0)));
`;
  const oldRuntime = runtime("old", true);
  const newRuntime = runtime("new", behavior !== "unready");
  for (const name of ["plugin.conf", "package.json", "health.sh", "titan-server-node.service"]) fs.copyFileSync(path.join(root, name), path.join(source, name));
  fs.writeFileSync(path.join(source, "runtime.mjs"), newRuntime);
  fs.writeFileSync(path.join(installed, "runtime.mjs"), oldRuntime);
  fs.writeFileSync(path.join(installed, "package.json"), '{"type":"module","name":"previous"}\n');
  fs.writeFileSync(path.join(installed, "prior-only.txt"), "keep in rollback artifact\n");
  fs.writeFileSync(unit, "previous service unit\n");
  fs.writeFileSync(config, `TITAN_NODE_PORT=${port}\nTITAN_NODE_AUTH_TOKEN=fixture-only\n`, { mode: 0o600 });
  fs.writeFileSync(store, '{"fixture":"durable control metadata"}\n');
  const supervisor = path.join(dir, "supervisor.mjs");
  fs.writeFileSync(supervisor, `import fs from "node:fs";
import { spawn } from "node:child_process";
const [command, ...args] = process.argv.slice(2);
const pidFile = ${JSON.stringify(pidFile)}, log = ${JSON.stringify(log)};
fs.appendFileSync(log, [command, ...args].join(" ") + "\\n");
const readPid = () => { try { return Number(fs.readFileSync(pidFile, "utf8")); } catch { return 0; } };
const stop = async () => { const pid = readPid(); if (pid) { try { process.kill(pid, "SIGTERM"); } catch {} } fs.rmSync(pidFile, { force:true }); for (let i=0;i<100;i++) { try { await fetch("http://127.0.0.1:${port}/live"); await new Promise(r=>setTimeout(r,10)); } catch { break; } } };
if (command === "daemon-reload") process.exit(0);
if (command === "stop") { await stop(); process.exit(0); }
if (command === "show") { console.log(readPid()); process.exit(0); }
if (command === "is-active") { const pid = readPid(); try { if (!pid) throw Error(); process.kill(pid,0); process.exit(0); } catch { process.exit(1); } }
if (command === "restart" || command === "start" || command === "try-restart") {
  await stop();
  if (${JSON.stringify(behavior)} === "rollback-fails") process.exit(1);
  if (${JSON.stringify(behavior)} === "restart-fails" && fs.readFileSync(${JSON.stringify(path.join(installed, "runtime.mjs"))}, "utf8").includes('"new"')) process.exit(1);
  const child=spawn(${JSON.stringify(process.execPath)}, [${JSON.stringify(path.join(installed, "runtime.mjs"))}], { detached:true, stdio:"ignore", env:{...process.env,TITAN_NODE_PORT:"${port}"} });
  child.unref(); fs.writeFileSync(pidFile,String(child.pid));
  for (let i=0;i<100;i++) { try { await fetch("http://127.0.0.1:${port}/live"); process.exit(0); } catch { await new Promise(r=>setTimeout(r,10)); } }
  process.exit(1);
}
throw new Error("unexpected systemctl command: " + command);
`);
  const harness = path.join(dir, "update-fixture.sh");
  fs.writeFileSync(harness, `#!/usr/bin/env bash\nset -euo pipefail\nid() { echo 1000; }\nsystemctl() { "${process.execPath}" "${supervisor}" "$@"; }\nsleep() { :; }\nsource "$1"\nshift\nupdate_server_node "$@"\n`);
  t.after(() => {
    try { process.kill(Number(fs.readFileSync(pidFile, "utf8")), "SIGTERM"); } catch {}
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { dir, source, installed, unit, backups, store, config, log, oldRuntime, newRuntime, port,
    update: () => run(harness, [path.join(root, "update.sh"), source, installed, unit, backups, config]),
  };
}

test("systemd uses the durable store inside its writable state directory", () => {
  const unit = fs.readFileSync(path.join(root, "titan-server-node.service"), "utf8");
  assert.match(unit, /^Environment=TITAN_NODE_STORE_PATH=\/var\/lib\/titan\/server-node\/control.json$/m);
  assert.match(unit, /^ProtectSystem=strict$/m);
  assert.match(unit, /^ReadWritePaths=\/var\/lib\/titan\/server-node$/m);
});

test("update promotes staged runtime and unit and retains the previous artifact", async (t) => {
  const f = await fixture(t);
  const result = await f.update();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(f.installed, "runtime.mjs"), "utf8"), f.newRuntime);
  assert.equal(fs.readFileSync(f.unit, "utf8"), fs.readFileSync(path.join(f.source, "titan-server-node.service"), "utf8"));
  assert.equal(fs.existsSync(path.join(f.installed, "prior-only.txt")), false);
  const report = JSON.parse(result.stdout);
  assert.equal(report.lifecycle, "updated");
  assert.equal(report.status, "live");
  assert.equal(fs.readFileSync(path.join(report.rollback_artifact, "runtime/runtime.mjs"), "utf8"), f.oldRuntime);
  assert.equal(fs.readFileSync(path.join(report.rollback_artifact, "titan-server-node.service"), "utf8"), "previous service unit\n");
  assert.equal((await (await fetch(`http://127.0.0.1:${f.port}/live`)).json()).version, "new");
  assert.equal(fs.readFileSync(f.store, "utf8"), '{"fixture":"durable control metadata"}\n');
});

for (const behavior of ["restart-fails", "unready", "wrong-pid"]) {
  test(`update restores previous runtime and service after ${behavior}`, async (t) => {
    const f = await fixture(t, behavior);
    fs.chmodSync(f.unit, 0o600);
    const result = await f.update();
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(path.join(f.installed, "runtime.mjs"), "utf8"), f.oldRuntime);
    assert.equal(fs.readFileSync(f.unit, "utf8"), "previous service unit\n");
    assert.equal(fs.statSync(f.unit).mode & 0o777, 0o600);
    assert.equal(fs.readFileSync(path.join(f.installed, "prior-only.txt"), "utf8"), "keep in rollback artifact\n");
    const report = JSON.parse(result.stdout);
    assert.equal(report.lifecycle, "update-failed");
    assert.equal(report.rollback, "restored");
    assert.equal((await (await fetch(`http://127.0.0.1:${f.port}/live`)).json()).version, "old");
    assert.equal(fs.readFileSync(f.store, "utf8"), '{"fixture":"durable control metadata"}\n');
  });
}

test("invalid staged runtime leaves the installation untouched and never restarts", async (t) => {
  const f = await fixture(t);
  fs.writeFileSync(path.join(f.source, "runtime.mjs"), "this is not javascript!\n");
  const result = await f.update();
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(path.join(f.installed, "runtime.mjs"), "utf8"), f.oldRuntime);
  assert.equal(fs.readFileSync(f.unit, "utf8"), "previous service unit\n");
  assert.equal(fs.existsSync(f.log), false);
  assert.match(result.stderr, /SyntaxError/);
});

test("symlink package input fails closed before changing installed files", async (t) => {
  const f = await fixture(t);
  fs.unlinkSync(path.join(f.source, "runtime.mjs"));
  fs.symlinkSync(path.join(f.installed, "runtime.mjs"), path.join(f.source, "runtime.mjs"));
  const result = await f.update();
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(f.log), false);
  assert.match(result.stderr, /package input must be a regular file/);
});

test("package test command includes safe lifecycle regression coverage", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.test, /lifecycle\.test\.mjs/);
  assert.match(pkg.scripts.test, /runtime\.security\.test\.mjs/);
});

test("non-root lifecycle validation never invokes a host supervisor", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "titan-node-validation-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Shell functions protect even root-run CI, without production test modes.
  for (const script of ["install.sh", "update.sh"]) {
    const harness = path.join(dir, script);
    fs.writeFileSync(harness, `set -euo pipefail\nid() { echo 1000; }\nsystemctl() { echo 'HOST SUPERVISOR MUST NOT RUN' >&2; return 97; }\nexport -f id systemctl\nbash "$1"\n`);
    const result = await run(harness, [path.join(root, script)]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).lifecycle, "validated");
  }
});

// These are deployment configuration assertions, not substituted OS ownership.
test("install keeps executable code root-owned and state owned by titan-node", () => {
  const script = fs.readFileSync(path.join(root, "install.sh"), "utf8");
  assert.match(script, /install -d -o titan-node -g titan-node -m 0750 \/var\/lib\/titan\/server-node\n/);
  assert.match(script, /install -d -m 0755 \/usr\/local\/titan\/server-node/);
  assert.match(script, /verify_server_node_process/);
});


test("rollback verification failure is reported without claiming recovery", async (t) => {
  const f = await fixture(t, "rollback-fails");
  const result = await f.update();
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.lifecycle, "update-failed");
  assert.equal(report.rollback, "failed");
  assert.equal(fs.readFileSync(path.join(f.installed, "runtime.mjs"), "utf8"), f.oldRuntime);
  assert.equal(fs.readFileSync(f.unit, "utf8"), "previous service unit\n");
});

test("invalid configured port fails closed without restarting or touching the installation", async (t) => {
  const f = await fixture(t);
  fs.writeFileSync(f.config, "TITAN_NODE_PORT=$(touch should-not-execute)\n");
  const result = await f.update();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid TITAN_NODE_PORT/);
  assert.equal(fs.existsSync(f.log), false);
  assert.equal(fs.readFileSync(path.join(f.installed, "runtime.mjs"), "utf8"), f.oldRuntime);
});


test("package validation fails before installation when flock is unavailable", async (t) => {
  const f = await fixture(t);
  const harness = path.join(f.dir, "without-flock.sh");
  fs.writeFileSync(harness, `set -euo pipefail\nsource "$1"\ncommand() { if [[ "$1" == "-v" && "$2" == "flock" ]]; then return 1; fi; builtin command "$@"; }\nvalidate_server_node_package "$2"\n`);
  const result = await run(harness, [path.join(root, "update.sh"), f.source]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /flock is required/);
  assert.equal(fs.existsSync(f.log), false);
});

test('root supervisor prerequisite checks the actual unit Node executable', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'titan-supervisor-node-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const harness=path.join(dir,'validate.sh');
  fs.writeFileSync(harness,'set -euo pipefail\nsource "$1"\nvalidate_server_node_supervisor_runtime "$2"\n');
  const absent=await run(harness,[path.join(root,'update.sh'),path.join(dir,'absent-node')]);
  assert.notEqual(absent.status,0);assert.match(absent.stderr,/supervisor Node executable/);
  const real=await run(harness,[path.join(root,'update.sh'),process.execPath]);assert.equal(real.status,0,real.stderr);
  const oldNode=path.join(dir,'old-node');fs.writeFileSync(oldNode,'#!/usr/bin/env bash\nexit 1\n',{mode:0o755});
  const outdated=await run(harness,[path.join(root,'update.sh'),oldNode]);assert.notEqual(outdated.status,0);assert.match(outdated.stderr,/Node.js 20/);
});
