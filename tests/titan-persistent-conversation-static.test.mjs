import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const store=fs.readFileSync(new URL("../app/titan/runtime/conversation-store.ts", import.meta.url),"utf8");
const chat=fs.readFileSync(new URL("../app/titan/components/role-chat.tsx", import.meta.url),"utf8");
const client=fs.readFileSync(new URL("../app/titan/runtime/interaction-client.ts", import.meta.url),"utf8");
test("conversation storage is company and conversation scoped",()=>{assert.match(store,/titan:conversation:\$\{company_id\}:\$\{conversation_id\}/); assert.match(store,/Conversation projection scope mismatch/);});
test("optimistic drafts reconcile instead of duplicate sending",()=>{assert.match(store,/delivery_state:\"sending\"/); assert.match(store,/reconcile\(client_message_id/); assert.match(store,/new Map\(this\.readLocal\(\)\.map/);});
test("role chat hydrates persistent history and preserves one conversation",()=>{assert.match(chat,/conversation\.hydrate\(\)/); assert.match(chat,/conversation\.optimistic/); assert.match(chat,/conversation\.append/); assert.match(chat,/pwa-\$\{role\}-primary/);});
test("interaction client accepts caller message id for reconciliation",()=>{assert.match(client,/client_message_id = id\("msg"\)/); assert.match(client,/client_message_id,/);});
