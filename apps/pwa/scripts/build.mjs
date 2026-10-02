import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(scriptPath), "..");
const versionToken = "__TITAN_PWA_SHELL_VERSION__";
const shellFiles = ["index.html", "app.mjs", "styles.css", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "sw.js"];

export function buildPwa({ publicDir = resolve(root, "public"), outputDir = resolve(root, "dist") } = {}) {
  const workerPath = resolve(publicDir, "sw.js");
  const worker = readFileSync(workerPath, "utf8");
  if (worker.split(versionToken).length !== 2) throw new Error("pwa:service-worker-version-token-invalid");

  const hash = createHash("sha256");
  for (const name of shellFiles) {
    hash.update(name).update("\0").update(readFileSync(resolve(publicDir, name))).update("\0");
  }
  const shellVersion = hash.digest("hex").slice(0, 16);

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(publicDir, outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, "sw.js"), worker.replace(versionToken, shellVersion));
  return shellVersion;
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const shellVersion = buildPwa();
  console.log(`PWA shell ${shellVersion} copied to ${resolve(root, "dist")}`);
}
