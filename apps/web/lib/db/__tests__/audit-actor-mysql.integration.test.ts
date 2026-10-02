/** MySQL migration compatibility test; connects only to a disposable test server. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import mysql, { type Connection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const connectionUrl = process.env.TEST_MYSQL_DATABASE_URL;
const mysqlDescribe = connectionUrl ? describe : describe.skip;
const databaseName = `test_audit_actor_${randomUUID().replaceAll("-", "")}`;
const companyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const historicalActor = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const historicalEntity = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const publicEntity = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const parseJson = (value: unknown): unknown => typeof value === "string" ? JSON.parse(value) : value;
const connectionConfig = (() => {
  if (!connectionUrl) return null;
  const url = new URL(connectionUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
})();

let admin: Connection | null = null;
let testDb: Connection | null = null;

mysqlDescribe("MySQL nullable audit actor migration", () => {
  beforeAll(async () => {
    if (!connectionConfig) throw new Error("Set TEST_MYSQL_DATABASE_URL to a disposable MySQL server");
    admin = await mysql.createConnection(connectionConfig);
    await admin.query(`CREATE DATABASE \`${databaseName}\``);
    testDb = await mysql.createConnection({ ...connectionConfig, database: databaseName });
    await testDb.query("CREATE TABLE accounts (id CHAR(36) PRIMARY KEY) ENGINE=InnoDB");
    await testDb.query("INSERT INTO accounts (id) VALUES (?)", [companyId]);
    const portableSchema = readFileSync(resolve(process.cwd(), "../../db/mysql/002_auth_clients_portable.sql"), "utf8");
    const auditTable = portableSchema.match(/CREATE TABLE IF NOT EXISTS audit_log \([\s\S]*?\) ENGINE=InnoDB;/i)?.[0];
    if (!auditTable) throw new Error("Committed MySQL audit schema was not found");
    await testDb.query(auditTable);
    await testDb.query(
      `INSERT INTO audit_log (id, account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
       VALUES (?, ?, 'estimate', ?, 'update', ?, '{"status":"draft"}', '{"status":"sent"}')`,
      [randomUUID(), companyId, historicalEntity, historicalActor],
    );
    await testDb.query(readFileSync(resolve(process.cwd(), "../../db/mysql/020_audit_log_nullable_actor.sql"), "utf8"));
  });

  afterAll(async () => {
    await testDb?.end();
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
      await admin.end();
    }
  });

  it("preserves CHAR(36), existing actors, company foreign keys and indexes while allowing anonymous rows", async () => {
    const [columns] = await testDb!.query<RowDataPacket[]>(
      "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM information_schema.columns WHERE table_schema = ? AND table_name = 'audit_log' AND column_name = 'actor_id'",
      [databaseName],
    );
    expect(columns).toEqual([{ DATA_TYPE: "char", CHARACTER_MAXIMUM_LENGTH: 36, IS_NULLABLE: "YES" }]);

    const [historicalRows] = await testDb!.query<RowDataPacket[]>(
      "SELECT account_id, entity_id, actor_id, old_value, new_value FROM audit_log WHERE entity_id = ?",
      [historicalEntity],
    );
    expect(historicalRows).toHaveLength(1);
    expect(historicalRows[0].actor_id).toBe(historicalActor);
    expect(parseJson(historicalRows[0].old_value)).toEqual({ status: "draft" });
    expect(parseJson(historicalRows[0].new_value)).toEqual({ status: "sent" });

    const [tableDefinitions] = await testDb!.query<RowDataPacket[]>("SHOW CREATE TABLE audit_log");
    const tableDefinition = String(tableDefinitions[0]["Create Table"]);
    expect(tableDefinition).toContain("KEY `idx_audit_account_created`");
    expect(tableDefinition).toContain("KEY `idx_audit_entity`");
    expect(tableDefinition).toContain("CONSTRAINT `fk_audit_account`");

    await testDb!.query(
      `INSERT INTO audit_log (id, account_id, entity_type, entity_id, action, actor_id, new_value)
       VALUES (?, ?, 'estimate', ?, 'update', NULL, '{"status":"approved","via":"portal"}')`,
      [randomUUID(), companyId, publicEntity],
    );
    const [publicRows] = await testDb!.query<RowDataPacket[]>("SELECT actor_id, new_value FROM audit_log WHERE entity_id = ?", [publicEntity]);
    expect(publicRows).toHaveLength(1);
    expect(publicRows[0].actor_id).toBeNull();
    expect(parseJson(publicRows[0].new_value)).toEqual({ status: "approved", via: "portal" });

    await expect(testDb!.query(
      `INSERT INTO audit_log (id, account_id, entity_type, entity_id, action, actor_id)
       VALUES (?, '99999999-9999-4999-8999-999999999999', 'estimate', ?, 'update', NULL)`,
      [randomUUID(), randomUUID()],
    )).rejects.toMatchObject({ code: "ER_NO_REFERENCED_ROW_2" });
  });
});
