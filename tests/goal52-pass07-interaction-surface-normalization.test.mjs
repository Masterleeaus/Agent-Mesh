import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../app/titan/runtime/interaction-client.ts",import.meta.url),"utf8");
test("interaction client canonicalizes surfaces",()=>{
 assert.match(source,/TitanSurface = "zero" \| "go" \| "hub"/);
 assert.doesNotMatch(source,/TitanSurface = .*"command"/);
 assert.match(source,/surface === "customer"/);
 assert.match(source,/return "hub"/);
 assert.match(source,/return "zero"/);
 assert.match(source,/normalizeInteractionSurface\(options\.surface\)/);
});
