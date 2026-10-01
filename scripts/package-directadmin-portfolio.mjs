import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ENABLED_PLUGINS = [
  { id: "titan-server-node", source: "apps/directadmin/server-node", files: ["plugin.conf", "install.sh", "update.sh", "uninstall.sh", "health.sh", "runtime.mjs", "package.json", "titan-server-node.service"] },
  { id: "titan_dev_access", source: "apps/directadmin/dev-access", files: ["plugin.conf", "README.md", "AGENTS.md", "admin", "reseller", "user", "hooks", "lib", "scripts", "images"] },
];

const executable = new Set(["admin/index.html", "reseller/index.html", "user/index.html", "install.sh", "update.sh", "uninstall.sh", "health.sh", "scripts/install.sh", "scripts/uninstall.sh"]);

function walk(source, relative = "") {
  const absolute = path.join(source, relative);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error(`symlink is not allowed: ${relative || "."}`);
  if (stat.isDirectory()) return fs.readdirSync(absolute).flatMap((name) => walk(source, path.join(relative, name)));
  if (!stat.isFile()) throw new Error(`unsupported package input: ${relative}`);
  return [relative];
}

function copyValidated(source, staging, relative) {
  const absolute = path.join(source, relative);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error(`symlink is not allowed: ${relative}`);
  if (stat.isDirectory()) {
    fs.mkdirSync(path.join(staging, relative), { recursive: true });
    for (const name of fs.readdirSync(absolute)) copyValidated(source, staging, path.join(relative, name));
    return;
  }
  if (!stat.isFile()) throw new Error(`unsupported package input: ${relative}`);
  fs.mkdirSync(path.dirname(path.join(staging, relative)), { recursive: true });
  fs.copyFileSync(absolute, path.join(staging, relative), fs.constants.COPYFILE_EXCL);
  fs.chmodSync(path.join(staging, relative), executable.has(relative.replaceAll("\\", "/")) ? 0o755 : 0o644);
}

function validateManifest(source, plugin) {
  const manifestPath = path.join(source, "plugin.conf");
  const manifest = fs.readFileSync(manifestPath, "utf8");
  const fields = Object.fromEntries(manifest.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=");
    if (index < 1) throw new Error(`${plugin.id}: invalid plugin.conf line`);
    return [line.slice(0, index), line.slice(index + 1)];
  }));
  if (fields.version && !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(fields.version)) throw new Error(`${plugin.id}: invalid version`);
  if (plugin.id === "titan-server-node" && fields.name !== plugin.id) throw new Error(`${plugin.id}: manifest id mismatch`);
  if (plugin.id === "titan_dev_access" && !/^Titan Dev Access$/.test(fields.name || "")) throw new Error(`${plugin.id}: donor manifest identity changed`);
  return fields;
}

export function packagePortfolio({ plugins = ENABLED_PLUGINS, outputDir = path.join(ROOT, "dist", "directadmin") } = {}) {
  const output = path.resolve(outputDir);
  fs.mkdirSync(output, { recursive: true });
  const artifacts = [];
  for (const plugin of plugins) {
    const source = path.resolve(ROOT, plugin.source);
    const manifest = validateManifest(source, plugin);
    for (const required of plugin.files) {
      if (!fs.existsSync(path.join(source, required))) throw new Error(`${plugin.id}: missing ${required}`);
    }
    const staging = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-portfolio-"));
    try {
      for (const entry of plugin.files) copyValidated(source, staging, entry);
      const archive = path.join(output, `${plugin.id}.tar.gz`);
      const tar = spawnSync("tar", ["--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner", "-czf", archive, "-C", staging, ...plugin.files], { encoding: "utf8" });
      if (tar.error || tar.status !== 0) throw tar.error ?? new Error(tar.stderr || `tar failed for ${plugin.id}`);
      const bytes = fs.readFileSync(archive);
      artifacts.push({ plugin_id: plugin.id, version: manifest.version ?? "unknown", archive, sha256: createHash("sha256").update(bytes).digest("hex"), source: plugin.source });
    } finally { fs.rmSync(staging, { recursive: true, force: true }); }
  }
  const provenance = { schema: "titan.directadmin.portfolio/v1", generated_at: "1970-01-01T00:00:00.000Z", artifacts: artifacts.map(({ archive, ...artifact }) => artifact) };
  fs.writeFileSync(path.join(output, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n", { mode: 0o644 });
  return { artifacts, provenance: path.join(output, "provenance.json") };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.stdout.write(JSON.stringify({ packaged: true, ...packagePortfolio({ outputDir: process.argv[2] ?? path.join(ROOT, "dist", "directadmin") }) }) + "\n");
}
