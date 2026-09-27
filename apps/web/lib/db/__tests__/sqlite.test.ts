import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function migratedDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  for (const file of ["001_canonical_storage.sql", "002_business_domain.sql"]) {
    db.exec(readFileSync(resolve(process.cwd(), "../../db/sqlite", file), "utf8"));
  }
  return db;
}

describe("SQLite canonical persistence", () => {
  it("creates a fresh schema with foreign keys enabled", () => {
    const db = migratedDb();
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name:string}>;
    expect(tables.some((row) => row.name === "companies")).toBe(true);
    expect(tables.some((row) => row.name === "jobs")).toBe(true);
    db.close();
  });

  it("enforces foreign keys", () => {
    const db = migratedDb();
    expect(() => db.prepare("INSERT INTO clients(id, company_id, name) VALUES(?,?,?)")
      .run("client-1", "missing-company", "Client")).toThrow();
    db.close();
  });

  it("rolls back a failed transaction", () => {
    const db = migratedDb();
    db.exec("INSERT INTO companies(id,name) VALUES('company-a','A')");
    const tx = db.transaction(() => {
      db.exec("INSERT INTO clients(id,company_id,name) VALUES('client-a','company-a','A')");
      throw new Error("fail");
    });
    expect(() => tx()).toThrow("fail");
    expect(db.prepare("SELECT count(*) AS n FROM clients").get()).toEqual({ n: 0 });
    db.close();
  });

  it("keeps intelligence, decision, authority and evidence as separate state", () => {
    const db = migratedDb();
    db.exec("INSERT INTO companies(id,name) VALUES('company-a','A')");
    db.prepare("INSERT INTO intelligence_records(id,company_id,intelligence_type,result_json) VALUES(?,?,?,?)")
      .run("intel-1", "company-a", "recommendation", "{}");
    expect(db.prepare("SELECT count(*) AS n FROM decision_records").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM authority_records").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM evidence_records").get()).toEqual({ n: 0 });
    db.close();
  });

  it("passes SQLite integrity_check", () => {
    const db = migratedDb();
    expect(db.pragma("integrity_check", { simple: true })).toBe("ok");
    db.close();
  });
});
