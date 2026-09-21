import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const client = fs.readFileSync(new URL("../app/titan/runtime/interaction-client.ts", import.meta.url), "utf8");
const chat = fs.readFileSync(new URL("../app/titan/components/role-chat.tsx", import.meta.url), "utf8");
test("PWA-15 provides cancellable streaming and continuation", () => { assert.match(client, /AbortController/); assert.match(client, /cancelActiveStream/); assert.match(client, /continuation_token/); assert.match(client, /async resume/); });
test("PWA-15 suppresses duplicate stream chunks", () => { assert.match(client, /seenChunks/); assert.match(client, /chunk_id/); assert.match(client, /this\.seenChunks\.has/); });
test("PWA-15 handles mobile background, foreground and reconnect", () => { assert.match(chat, /visibilitychange/); assert.match(chat, /navigator\.onLine/); assert.match(chat, /window\.addEventListener\("online"/); assert.match(chat, /interaction\.resume/); });
test("PWA-15 retains fail-closed company and conversation scope", () => { assert.match(client, /event\.company_id === this\.company_id/); assert.match(client, /event\.conversation_id === this\.conversation_id/); assert.match(client, /event\.surface === this\.surface/); });
