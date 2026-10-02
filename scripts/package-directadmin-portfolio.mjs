import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_FILES as SERVER_NODE_PACKAGE_FILES, EXECUTABLE_FILES as SERVER_NODE_EXECUTABLE_FILES } from "./package-directadmin-plugin.mjs";
import { packageFiles as WORKFORCE_PACKAGE_FILES } from "../apps/directadmin/workforce/tools/package.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFORCE_SDK_SOURCE = "packages/titan-platform/src/directadmin-plugin.ts";
const ROOT_PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const WORKFORCE_SDK_COMPILER_VERSION = ROOT_PACKAGE.devDependencies?.esbuild;
const DEVELOPER_PORTAL_EXECUTABLE_FILES = [
  "admin/index.html", "reseller/index.html", "user/index.html",
  "scripts/install.sh", "scripts/update.sh", "scripts/uninstall.sh",
];
export const ENABLED_PLUGINS = [
  { id: "titan-server-node", displayName: "titan-server-node", source: "apps/directadmin/server-node", files: SERVER_NODE_PACKAGE_FILES, executableFiles: SERVER_NODE_EXECUTABLE_FILES },
  { id: "titan_dev_access", displayName: "Developer Portal", legacyDisplayNames: { "1.2.0": "Titan Dev Access" }, source: "apps/directadmin/dev-access", files: ["plugin.conf", "README.md", "AGENTS.md", "admin", "reseller", "user", "hooks", "lib", "scripts"], executableFiles: DEVELOPER_PORTAL_EXECUTABLE_FILES },
  { id: "titan_workforce", displayName: "Titan Workforce", source: "apps/directadmin/workforce", files: WORKFORCE_PACKAGE_FILES, generatedFiles: ["images/sdk.mjs"], executableFiles: ["admin/index.html", "reseller/index.html", "user/index.html", "scripts/install.sh", "scripts/update.sh", "scripts/uninstall.sh"], packager: "apps/directadmin/workforce/tools/package.mjs", dependencies: ["titan-server-node"] },
];

function sha256File(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function publishImmutableFile(candidate, destination, expectedSha256, label) {
  if (fs.existsSync(destination)) {
    if (sha256File(destination) !== expectedSha256) throw new Error(`${label}: refusing to overwrite existing file with different contents: ${destination}`);
    return;
  }
  try {
    fs.copyFileSync(candidate, destination, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "EEXIST" || sha256File(destination) !== expectedSha256) throw error.code === "EEXIST"
      ? new Error(`${label}: refusing to overwrite existing file with different contents: ${destination}`)
      : error;
  }
}

function publishImmutableBytes(bytes, destination, label) {
  if (fs.existsSync(destination)) {
    if (!fs.readFileSync(destination).equals(bytes)) throw new Error(`${label}: refusing to overwrite existing file with different contents: ${destination}`);
    return;
  }
  try {
    fs.writeFileSync(destination, bytes, { mode: 0o644, flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST" || !fs.readFileSync(destination).equals(bytes)) throw error.code === "EEXIST"
      ? new Error(`${label}: refusing to overwrite existing file with different contents: ${destination}`)
      : error;
  }
}

function buildCanonicalWorkforceSdk(temporaryDir) {
  const compilerManifestPath = path.join(ROOT, "node_modules", "esbuild", "package.json");
  let compilerManifest;
  try { compilerManifest = JSON.parse(fs.readFileSync(compilerManifestPath, "utf8")); }
  catch (error) { throw new Error(`Workforce SDK build requires root dependency esbuild@${WORKFORCE_SDK_COMPILER_VERSION}; install locked dependencies first: ${error.message}`); }
  if (compilerManifest.version !== WORKFORCE_SDK_COMPILER_VERSION) {
    throw new Error(`Workforce SDK build requires esbuild@${WORKFORCE_SDK_COMPILER_VERSION}; found ${compilerManifest.version ?? "unknown"}`);
  }
  const compiler = path.join(ROOT, "node_modules", "esbuild", "bin", "esbuild");
  const source = path.join(ROOT, WORKFORCE_SDK_SOURCE);
  const output = path.join(temporaryDir, "titan-directadmin-cockpit-sdk.mjs");
  const result = spawnSync(compiler, [source, "--bundle", "--format=esm", "--platform=browser", "--target=es2022", `--outfile=${output}`], { encoding: "utf8" });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`Workforce SDK build failed: ${result.stderr || result.stdout}`);
  return {
    sdkModulePath: output,
    buildInputs: {
      sdk: {
        source: WORKFORCE_SDK_SOURCE,
        source_sha256: sha256File(source),
        compiler: `esbuild@${compilerManifest.version}`,
        compiler_flags: ["--bundle", "--format=esm", "--platform=browser", "--target=es2022"],
        compiled_sha256: sha256File(output),
      },
    },
  };
}

function runCanonicalWorkforcePackager({ plugin, source, sdkModulePath, temporaryDir }) {
  const packageOutput = path.join(temporaryDir, "workforce-package");
  fs.mkdirSync(packageOutput);
  const packager = path.join(ROOT, plugin.packager);
  const result = spawnSync(process.execPath, [packager, "--source-dir", source, "--sdk-module", sdkModulePath, "--output-dir", packageOutput], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${plugin.id}: canonical packager failed: ${result.stderr || result.stdout}`);
  let response;
  try { response = JSON.parse(result.stdout.trim()); }
  catch { throw new Error(`${plugin.id}: canonical packager returned invalid JSON: ${result.stdout}`); }
  const archive = path.join(packageOutput, `${plugin.id}.tar.gz`);
  const sidecar = `${archive}.sha256`;
  const expectedSidecar = `${response.sha256}  ${plugin.id}.tar.gz\n`;
  if (response.archivePath !== archive || !fs.existsSync(archive) || !fs.existsSync(sidecar)) throw new Error(`${plugin.id}: canonical packager output is incomplete`);
  if (sha256File(archive) !== response.sha256 || fs.readFileSync(sidecar, "utf8") !== expectedSidecar) throw new Error(`${plugin.id}: canonical packager checksum sidecar mismatch`);
  return { archive, sha256: response.sha256 };
}

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

export function packagePortfolio({ plugins = ENABLED_PLUGINS, outputDir = path.join(ROOT, "dist", "directadmin"), workforceSdkModulePath } = {}) {
  const output = path.resolve(outputDir);
  fs.mkdirSync(output, { recursive: true });
  const artifacts = [];
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-portfolio-build-"));
  try {
    const workforcePlugin = plugins.find((plugin) => plugin.packager);
    let workforceSdk;
    if (workforcePlugin) {
      if (workforceSdkModulePath) {
        const sdkPath = path.resolve(workforceSdkModulePath);
        const stat = fs.lstatSync(sdkPath);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Workforce SDK module must be a regular file, not a symlink.");
        workforceSdk = {
          sdkModulePath: sdkPath,
          buildInputs: { sdk: { source: "externally supplied module (test or isolated build)", compiled_sha256: sha256File(sdkPath) } },
        };
      } else {
        workforceSdk = buildCanonicalWorkforceSdk(temporaryDir);
      }
    }
    for (const plugin of plugins) {
      const source = path.resolve(ROOT, plugin.source);
      const manifest = validateManifest(source, plugin);
      for (const required of plugin.files) {
        if (!fs.existsSync(path.join(source, required)) && !plugin.generatedFiles?.includes(required)) throw new Error(`${plugin.id}: missing ${required}`);
      }
      const dependencies = (plugin.dependencies ?? []).map((dependencyId) => {
        const dependency = artifacts.find((artifact) => artifact.plugin_id === dependencyId);
        if (!dependency) throw new Error(`${plugin.id}: dependency ${dependencyId} must be packaged before this plugin`);
        return { plugin_id: dependency.plugin_id, version: dependency.version, archive_filename: path.basename(dependency.archive), sha256: dependency.sha256 };
      });
      let candidate;
      let sha256;
      if (plugin.packager) {
        if (plugin.id !== "titan_workforce") throw new Error(`${plugin.id}: unsupported canonical packager ${plugin.packager}`);
        const packaged = runCanonicalWorkforcePackager({ plugin, source, sdkModulePath: workforceSdk.sdkModulePath, temporaryDir });
        candidate = packaged.archive;
        sha256 = packaged.sha256;
        validateArchive(candidate, plugin);
      } else {
        const staging = fs.mkdtempSync(path.join(temporaryDir, `${plugin.id}-stage-`));
        for (const entry of plugin.files) copyValidated(source, staging, entry, new Set(plugin.executableFiles));
        candidate = path.join(temporaryDir, `${plugin.id}.tar.gz`);
        const tar = spawnSync("tar", ["--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner", "-czf", candidate, "-C", staging, ...plugin.files], { encoding: "utf8" });
        if (tar.error || tar.status !== 0) throw tar.error ?? new Error(tar.stderr || `tar failed for ${plugin.id}`);
        validateArchive(candidate, plugin);
        sha256 = sha256File(candidate);
      }
      const archive = path.join(output, `${plugin.id}.tar.gz`);
      const sidecar = `${archive}.sha256`;
      publishImmutableFile(candidate, archive, sha256, plugin.id);
      const sidecarBytes = Buffer.from(`${sha256}  ${path.basename(archive)}\n`);
      publishImmutableBytes(sidecarBytes, sidecar, plugin.id);
      artifacts.push({
        plugin_id: plugin.id,
        version: manifest.version ?? "unknown",
        archive_filename: path.basename(archive),
        archive,
        sha256,
        source: plugin.source,
        dependencies,
        ...(plugin.packager ? { build_inputs: workforceSdk.buildInputs } : {}),
      });
    }
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
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
