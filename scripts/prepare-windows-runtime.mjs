import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const standalone = path.join(repo, "apps", "web", ".next", "standalone");
const webStandalone = path.join(standalone, "apps", "web");

if (!fs.existsSync(standalone)) {
  throw new Error("Missing apps/web/.next/standalone. Run the web production build first.");
}

fs.mkdirSync(webStandalone, { recursive: true });

function copyIfPresent(from, to) {
  if (!fs.existsSync(from)) return;
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

copyIfPresent(
  path.join(repo, "apps", "web", ".next", "static"),
  path.join(webStandalone, ".next", "static")
);
copyIfPresent(
  path.join(repo, "apps", "web", "public"),
  path.join(webStandalone, "public")
);

const candidates = [
  path.join(webStandalone, "server.js"),
  path.join(standalone, "server.js"),
];
if (!candidates.some(fs.existsSync)) {
  throw new Error("Next standalone build completed but no server.js was found.");
}

console.log("Titan Zero standalone runtime staged for desktop packaging.");
