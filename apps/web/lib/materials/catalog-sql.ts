import type { DatabaseDialect } from "@/lib/db-contract";

const columns = `id, account_id, name, brand, category, unit, unit_cost_cents, supplier, sku,
              last_purchased_at, notes, is_active, avg_paid_cents, purchase_count`;

export function buildMaterialCatalogSql(dialect: DatabaseDialect) {
  const p = (n: number) => dialect === "mysql" ? "?" : `$${n}`;
  const trim = (value: string) => dialect === "mysql" ? `TRIM(${value})` : `btrim(${value})`;
  const now = dialect === "mysql" ? "CURRENT_TIMESTAMP" : "now()";
  const returning = dialect === "postgres" ? ` RETURNING ${columns}` : "";

  return {
    findBySku: `SELECT ${columns} FROM materials_price_book
      WHERE account_id = ${p(1)} AND is_active = true AND sku IS NOT NULL
        AND lower(${trim("sku")}) = lower(${trim(p(2))}) LIMIT 1`,
    findByName: `SELECT ${columns} FROM materials_price_book
      WHERE account_id = ${p(1)} AND is_active = true
        AND lower(${trim("name")}) = lower(${trim(p(2))}) AND unit = ${p(3)} LIMIT 1`,
    update: `UPDATE materials_price_book SET
      unit_cost_cents = ${p(2)}, avg_paid_cents = ${p(3)}, purchase_count = ${p(4)},
      sku = COALESCE(NULLIF(${trim(p(5))}, ''), sku), supplier = COALESCE(${p(6)}, supplier),
      last_purchased_at = ${p(7)},
      name = CASE WHEN length(${trim(p(8))}) > length(${trim("name")}) THEN ${trim(p(8))} ELSE name END,
      updated_at = ${now}
      WHERE id = ${p(1)} AND account_id = ${p(9)}${returning}`,
    insert: `INSERT INTO materials_price_book
      (account_id, name, category, unit, unit_cost_cents, supplier, sku,
       last_purchased_at, avg_paid_cents, purchase_count)
      VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}, ${p(8)}, ${p(5)}, 1)${returning}`,
    selectById: `SELECT ${columns} FROM materials_price_book WHERE id = ${p(1)} AND account_id = ${p(2)} LIMIT 1`,
    selectByNaturalKey: `SELECT ${columns} FROM materials_price_book WHERE account_id = ${p(1)}
      AND lower(${trim("name")}) = lower(${trim(p(2))}) AND unit = ${p(3)} LIMIT 1`,
  };
}
