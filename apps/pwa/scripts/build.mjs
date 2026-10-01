import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(root, "public"), output, { recursive: true });
console.log(`PWA shell copied to ${output}`);
