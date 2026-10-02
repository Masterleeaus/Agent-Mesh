import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_FILES as SERVER_NODE_PACKAGE_FILES, EXECUTABLE_FILES as SERVER_NODE_EXECUTABLE_FILES } from "./package-directadmin-plugin.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEVELOPER_PORTAL_EXECUTABLE_FILES = [
  "admin/index.html", "reseller/index.html", "user/index.html",
  "scripts/install.sh", "scripts/update.sh", "scripts/uninstall.sh",
];
export const ENABLED_PLUGINS = [
  { id: "titan-server-node", displayName: "titan-server-node", source: "apps/directadmin/server-node", files: SERVER_NODE_PACKAGE_FILES, executableFiles: SERVER_NODE_EXECUTABLE_FILES },
  { id: "titan_dev_access", displayName: "Developer Portal", legacyDisplayNames: { "1.2.0": "Titan Dev Access" }, source: "apps/directadmin/dev-access", files: ["plugin.conf", "README.md", "AGENTS.md", "admin", "reseller", "user", "hooks", "lib", "scripts"], executableFiles: DEVELOPER_PORTAL_EXECUTABLE_FILES },
];

function copyValidated(source, staging, relative, executableFiles) {
  const absolute = path.join(source, relative);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error(`symlink is not allowed: ${relative}`);
  if (stat.isDirectory()) {
    fs.mkdirSync(path.join(staging, relative), { recursive: true });
    for (const name of fs.readdirSync(absolute)) copyValidated(source, staging, path.join(relative, name), executableFiles);
    return;
  }
  if (!stat.isFile()) throw new Error(`unsupported package input: ${relative}`);
  fs.mkdirSync(path.dirname(path.join(staging, relative)), { recursive: true });
  fs.copyFileSync(absolute, path.join(staging, relative), fs.constants.COPYFILE_EXCL);
  fs.chmodSync(path.join(staging, relative), executableFiles.has(relative.replaceAll("\\", "/")) ? 0o755 : 0o644);
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
  const expectedDisplayName = plugin.legacyDisplayNames?.[fields.version] ?? plugin.displayName;
  if (typeof plugin.displayName !== "string" || !plugin.displayName || fields.name !== expectedDisplayName) {
    throw new Error(`${plugin.id}: manifest display name mismatch`);
  }
  return fields;
}

function validateArchive(archive, plugin) {
  const listing = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
  if (listing.error || listing.status !== 0) throw listing.error ?? new Error(`${plugin.id}: archive cannot be listed`);
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean).map((entry) => entry.replace(/^\.\//, ""));
  if (entries.some((entry) => entry.startsWith("/") || entry.split("/").includes(".."))) throw new Error(`${plugin.id}: archive contains unsafe path`);
  for (const required of plugin.files) if (!entries.includes(required) && !entries.includes(`${required}/`)) throw new Error(`${plugin.id}: archive missing ${required}`);
  for (const executablePath of plugin.executableFiles) if (!entries.includes(executablePath)) throw new Error(`${plugin.id}: archive missing executable ${executablePath}`);
  const details = spawnSync("tar", ["-tvzf", archive], { encoding: "utf8" });
  if (details.error || details.status !== 0) throw details.error ?? new Error(`${plugin.id}: archive metadata cannot be read`);
  for (const executablePath of plugin.executableFiles) {
    if (!details.stdout.split(/\r?\n/).some((line) => /^-rwxr-xr-x\s/.test(line) && line.endsWith(` ${executablePath}`))) throw new Error(`${plugin.id}: executable mode missing for ${executablePath}`);
  }
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
      const executableFiles = new Set(plugin.executableFiles);
      for (const entry of plugin.files) copyValidated(source, staging, entry, executableFiles);
      const archive = path.join(output, `${plugin.id}\.tar.gz`);
      const candidate = path.join(os.tmpdir(), `titan-da-${plugin.id}-${process.pid}-${Date.now()}\.tar.gz`);
      const tar = spawnSync("tar", ["--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner", "-czf", candidate, "-C", staging, ...plugin.files], { encoding: "utf8" });
      if (tar.error || tar.status !== 0) throw tar.error ?? new Error(tar.stderr || `tar failed for ${plugin.id}`);
      try {
        validateArchive(candidate, plugin);
        const bytes = fs.readFileSync(candidate);
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        if (fs.existsSync(archive)) {
          const existingHash = createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
          if (existingHash !== sha256) throw new Error(`${plugin.id}: refusing to overwrite existing archive with different contents: ${archive}`);
        } else {
          fs.copyFileSync(candidate, archive, fs.constants.COPYFILE_EXCL);
        }
        artifacts.push({ plugin_id: plugin.id, version: manifest.version ?? "unknown", archive, sha256, source: plugin.source });
      } finally {
        fs.rmSync(candidate, { force: true });
      }
    } finally { fs.rmSync(staging, { recursive: true, force: true }); }
  }
  const provenance = { schema: "titan.directadmin.portfolio/v1", generated_at: "1970-01-01T00:00:00.000Z", artifacts: artifacts.map(({ archive, ...artifact }) => artifact) };
  const provenancePath = path.join(output, "provenance.json");
  const provenanceBytes = JSON.stringify(provenance, null, 2) + "\n";
  if (fs.existsSync(provenancePath)) {
    if (fs.readFileSync(provenancePath, "utf8") !== provenanceBytes) throw new Error(`refusing to overwrite existing provenance with different contents: ${provenancePath}`);
  } else {
    fs.writeFileSync(provenancePath, provenanceBytes, { mode: 0o644, flag: "wx" });
  }
  return { artifacts, provenance: provenancePath };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.stdout.write(JSON.stringify({ packaged: true, ...packagePortfolio({ outputDir: process.argv[2] ?? path.join(ROOT, "dist", "directadmin") }) }) + "\n");
}
