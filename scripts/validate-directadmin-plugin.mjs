import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "apps/directadmin/server-node");
const required = ["plugin.conf", "install.sh", "update.sh", "uninstall.sh", "health.sh"];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) throw new Error(`DirectAdmin plugin package is incomplete: ${missing.join(", ")}`);
const config = fs.readFileSync(path.join(root, "plugin.conf"), "utf8");
for (const key of ["name", "version", "description"]) if (!new RegExp(`^${key}=.+$`, "m").test(config)) throw new Error(`plugin.conf is missing ${key}`);
if (!config.includes("name=titan-server-node")) throw new Error("unexpected plugin identity");
console.log(JSON.stringify({ valid: true, root, required }));

