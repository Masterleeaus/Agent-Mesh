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
  assert.match(env, /^TITAN_DEPLOYMENT_PROFILE=local$/m);
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

test("legacy OpenAI and SMS gateway consumers are disclosed as inactive compatibility inputs", () => {
  for (const file of [".env.example", "infra/vps.env.example"]) {
    const env = read(file);
    for (const variable of ["OPENAI_API_KEY", "SMS_GATEWAY_URL", "SMS_GATEWAY_USERNAME", "SMS_GATEWAY_PASSWORD"]) {
      assert.equal(activeValue(env, variable), false, `${file}: ${variable} must not be a node-wide default`);
      assert.match(env, new RegExp(`^# ${variable}=`, "m"), `${file}: disclose ${variable} as compatibility-only`);
    }
  }
});

test("VPS template declares the Workforce commissioning values and trusted key paths required by Compose", () => {
  const env = read("infra/vps.env.example");
  for (const variable of [
    "WORKFORCE_DIRECTADMIN_NODE_ID",
    "WORKFORCE_SESSION_ISSUER",
    "WORKFORCE_SESSION_KEY_ID",
    "WORKFORCE_SESSION_ALGORITHM",
    "WORKFORCE_UPSTREAM_SESSION_ISSUER",
    "WORKFORCE_UPSTREAM_SESSION_AUDIENCE",
    "WORKFORCE_UPSTREAM_SESSION_KEY_ID",
    "WORKFORCE_UPSTREAM_SESSION_ALGORITHM",
    "WORKFORCE_COMPANY_STORE_HOST_ROOT",
    "WORKFORCE_IDENTITY_SQLITE_HOST_PATH",
    "WORKFORCE_SESSION_PUBLIC_KEY_HOST_PATH",
    "WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_HOST_PATH",
  ]) assert.equal(activeValue(env, variable), true, `${variable} must be declared`);
});

test("optional DirectAdmin module remains inactive until commissioned", () => {
  const env = read("infra/vps.env.example");
  assert.equal(activeValue(env, "WORKFORCE_DIRECTADMIN_DEPENDENCIES_MODULE"), false);
  assert.match(env, /^# WORKFORCE_DIRECTADMIN_DEPENDENCIES_MODULE=/m);
});

test("VPS template keeps canonical company storage root and marks legacy booking selector inactive", () => {
  const env = read("infra/vps.env.example");
  assert.match(env, /^DATABASE_DIALECT=sqlite$/m);
  assert.match(env, /^TITAN_DEPLOYMENT_PROFILE=vps$/m);
  assert.match(env, /^TITAN_COMPANY_DATA_ROOT=/m);
  assert.equal(activeValue(env, "BOOKING_ACCOUNT_ID"), false);
});

test("VPS installer never invents an account selector or hardcodes legacy AI/PostgreSQL", () => {
  const installer = read("scripts/vps/install-sqlite-vps.sh");
  assert.doesNotMatch(installer, /setenv\s+BOOKING_ACCOUNT_ID/);
  assert.doesNotMatch(installer, /kernel\/random\/uuid/);
  assert.doesNotMatch(installer, /ANTHROPIC_API_KEY|POSTGRES_DB|ai_fsm/);
  assert.doesNotMatch(installer, /initialize-workforce-identity\.ts/);
  assert.match(installer, /WORKFORCE_IDENTITY_SQLITE_HOST_PATH/);
  assert.match(installer, /WORKFORCE_SESSION_PUBLIC_KEY_HOST_PATH/);
  assert.match(installer, /\/health/);
  assert.match(installer, /\/ready/);
});
