import test from "node:test";
import assert from "node:assert/strict";
import { validateDirectAdminPluginPackage, assertPluginCanBeInstalled } from "../.test-dist/directadmin-plugin.js";
const base={plugin_id:"titan_sdk",version:"1.0.0",files:["plugin.conf","README.md","AGENTS.md","scripts/install.sh","scripts/uninstall.sh","admin/index.php","reseller/index.php","user/index.php"],role_entrypoints:{admin:"admin/index.php",reseller:"reseller/index.php",user:"user/index.php"},hooks:["hooks/navigation.php"]};
test("accepts a complete flat plugin package",()=>{const r=validateDirectAdminPluginPackage(base);assert.equal(r.valid,true);assert.equal(assertPluginCanBeInstalled(r),true);});
test("reports missing package contract files and roles",()=>{const r=validateDirectAdminPluginPackage({...base,files:["plugin.conf"],role_entrypoints:{...base.role_entrypoints,admin:"admin/missing.php"}});assert.equal(r.valid,false);assert.ok(r.errors.includes("missing-file:README.md"));assert.ok(r.errors.includes("missing-role-entrypoint:admin"));});
test("rejects traversal paths",()=>{const r=validateDirectAdminPluginPackage({...base,files:[...base.files,"../secrets"],hooks:["hooks/../secret.php"]});assert.equal(r.valid,false);assert.ok(r.errors.includes("unsafe-file-path"));assert.ok(r.errors.some(x=>x.startsWith("unsafe-hook-path:")));assert.throws(()=>assertPluginCanBeInstalled(r),/plugin-validation-failed/);});

