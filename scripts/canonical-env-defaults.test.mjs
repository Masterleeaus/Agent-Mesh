import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const activeValue = (text, name) => new RegExp(`^\\s*${name}\\s*=`, "m").test(text);

test("root env example defaults to SQLite/company placement, not retired shared PostgreSQL", () => {
  const env = read(".env.example");
  assert.match(env, /^DATABASE_DIALECT=sqlite$/m);
  assert.match(env, /^DATABASE_URL=file:/m);
  assert.match(env, /^TITAN_COMPANY_DATA_ROOT=/m);
  assert.equal(activeValue(env, "POSTGRES_DB"), false);
  assert.equal(activeValue(env, "POSTGRES_USER"), false);
  assert.equal(activeValue(env, "POSTGRES_PASSWORD"), false);
  assert.equal(activeValue(env, "BOOKING_ACCOUNT_ID"), false);
});

test("shared env templates do not activate company-specific AI or SMTP credentials", () => {
  for (const file of [".env.example", "infra/vps.env.example"]) {
    const env = read(file);
    assert.equal(activeValue(env, "ANTHROPIC_API_KEY"), false, `${file}: shared Anthropic key must be compatibility-only`);
    assert.equal(activeValue(env, "SMTP_USER"), false, `${file}: shared SMTP user must be compatibility-only`);
    assert.equal(activeValue(env, "SMTP_PASS"), false, `${file}: shared SMTP password must be compatibility-only`);
  }
});

test("VPS template keeps canonical company storage root and marks legacy booking selector inactive", () => {
  const env = read("infra/vps.env.example");
  assert.match(env, /^DATABASE_DIALECT=sqlite$/m);
  assert.match(env, /^TITAN_COMPANY_DATA_ROOT=/m);
  assert.equal(activeValue(env, "BOOKING_ACCOUNT_ID"), false);
});
