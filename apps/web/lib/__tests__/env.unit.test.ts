import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnv, _resetEnvCache } from "../env";

const VALID_ENV = {
  DATABASE_URL: "file:./data/test-titan-zero.db",
  DATABASE_DIALECT: "sqlite",
  REDIS_URL: "redis://localhost:6379/0",
  AUTH_SECRET: "this-is-a-valid-secret-exactly-32-chars!",
  NODE_ENV: "test",
  TITAN_DEPLOYMENT_PROFILE: "test",
};

const ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_DIALECT",
  "REDIS_URL",
  "AUTH_SECRET",
  "NODE_ENV",
  "TITAN_DEPLOYMENT_PROFILE",
  "NEXT_PHASE",
  "BOOKING_ACCOUNT_ID",
  "ANTHROPIC_API_KEY",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

describe("getEnv validation", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    _resetEnvCache();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
    _resetEnvCache();
  });

  it("throws a descriptive error when AUTH_SECRET is too short", () => {
    Object.assign(process.env, { ...VALID_ENV, AUTH_SECRET: "tooshort" });
    expect(() => getEnv()).toThrow(/AUTH_SECRET must be at least 32 characters/);
  });

  it("defaults to the canonical local SQLite URL when DATABASE_URL is absent", () => {
    Object.assign(process.env, { ...VALID_ENV });
    delete process.env.DATABASE_URL;
    expect(getEnv().DATABASE_URL).toBe("file:./data/titan-zero.db");
  });

  it("retains the SQLite runtime default in production with a valid secret", () => {
    Object.assign(process.env, { ...VALID_ENV, NODE_ENV: "production" });
    delete process.env.DATABASE_URL;
    expect(getEnv().DATABASE_URL).toBe("file:./data/titan-zero.db");
  });

  it("succeeds when REDIS_URL is absent (field is optional)", () => {
    Object.assign(process.env, { ...VALID_ENV });
    delete process.env.REDIS_URL;
    expect(() => getEnv()).not.toThrow();
  });

  it("returns parsed canonical SQLite env when all values are valid", () => {
    Object.assign(process.env, VALID_ENV);
    const env = getEnv();
    expect(env.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
    expect(env.DATABASE_DIALECT).toBe("sqlite");
    expect(env.AUTH_SECRET).toBe(VALID_ENV.AUTH_SECRET);
    expect(env.TITAN_DEPLOYMENT_PROFILE).toBe("test");
  });

  it("accepts a production VPS profile with SQLite and no provider credential", () => {
    Object.assign(process.env, {
      ...VALID_ENV,
      NODE_ENV: "production",
      TITAN_DEPLOYMENT_PROFILE: "vps",
      DATABASE_DIALECT: "sqlite",
      DATABASE_URL: "file:/app/data/titan-zero.db",
    });
    delete process.env.ANTHROPIC_API_KEY;
    expect(getEnv().TITAN_DEPLOYMENT_PROFILE).toBe("vps");
  });

  it("rejects a VPS profile selecting PostgreSQL without echoing the URL", () => {
    Object.assign(process.env, {
      ...VALID_ENV,
      NODE_ENV: "production",
      TITAN_DEPLOYMENT_PROFILE: "vps",
      DATABASE_DIALECT: "postgres",
      DATABASE_URL: "postgresql://user:secret@db.example/ai_fsm",
    });
    let message = "";
    try { getEnv(); } catch (error) { message = error instanceof Error ? error.message : String(error); }
    expect(message).toMatch(/DATABASE_DIALECT.*VPS profile requires SQLite/);
    expect(message).not.toContain("secret");
    expect(message).not.toContain("db.example");
  });

  it("rejects a local profile selecting PostgreSQL", () => {
    Object.assign(process.env, {
      ...VALID_ENV,
      TITAN_DEPLOYMENT_PROFILE: "local",
      DATABASE_DIALECT: "postgres",
      DATABASE_URL: "postgresql://test:test@localhost/ai_fsm",
    });
    expect(() => getEnv()).toThrow(/local profile requires SQLite/);
  });

  it("does not require a shared remote AI or SMTP credential", () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(() => getEnv()).not.toThrow();
  });

  it("throws when BOOKING_ACCOUNT_ID is present but not a UUID", () => {
    Object.assign(process.env, { ...VALID_ENV, BOOKING_ACCOUNT_ID: "not-a-uuid" });
    expect(() => getEnv()).toThrow(/BOOKING_ACCOUNT_ID/);
  });

  it("error message includes [startup] prefix for visibility", () => {
    Object.assign(process.env, { ...VALID_ENV, AUTH_SECRET: "x" });
    expect(() => getEnv()).toThrow(/\[startup\]/);
  });

  it("build-time bypass activates when NEXT_PHASE=phase-production-build", () => {
    // Build discovery needs no runtime secrets; it must not choose PostgreSQL.
    process.env.NEXT_PHASE = "phase-production-build";
    expect(() => getEnv()).not.toThrow();
    expect(getEnv().DATABASE_URL).toBe("file:./data/titan-zero.db");
    expect(getEnv().DATABASE_DIALECT).toBe("sqlite");
  });

  it("rejects an explicitly empty storage URL instead of silently selecting a database", () => {
    Object.assign(process.env, { ...VALID_ENV, DATABASE_URL: "" });
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("does not apply the build secret bypass at production runtime", () => {
    process.env.NODE_ENV = "production";
    expect(() => getEnv()).toThrow(/AUTH_SECRET/);
  });

  it("caches the result on second call", () => {
    Object.assign(process.env, VALID_ENV);
    const first = getEnv();
    const second = getEnv();
    expect(first).toBe(second);
  });
});
