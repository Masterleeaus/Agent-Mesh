import { portableQuery } from "@/lib/db/portable";

export type ProfitabilityDimensionRow = {
  dimension_id: string;
  dimension_name: string;
  revenue_cents: number;
  cost_cents: number;
  profit_cents: number;
};

function normalize(rows: Array<{dimension_id:string;dimension_name:string;revenue_cents:number|string;cost_cents:number|string}>): ProfitabilityDimensionRow[] {
  return rows.map((r) => {
    const revenue = Number(r.revenue_cents ?? 0);
    const cost = Number(r.cost_cents ?? 0);
    return { dimension_id:r.dimension_id, dimension_name:r.dimension_name, revenue_cents:revenue, cost_cents:cost, profit_cents:revenue-cost };
  });
}

export async function profitabilityByJob(accountId: string): Promise<ProfitabilityDimensionRow[]> {
  const rows = await portableQuery<any>(
    `SELECT j.id AS dimension_id, COALESCE(j.title, j.id) AS dimension_name,
            COALESCE(inv.revenue_cents,0) AS revenue_cents,
            COALESCE(exp.cost_cents,0) AS cost_cents
       FROM jobs j
       LEFT JOIN (SELECT job_id, SUM(paid_cents) AS revenue_cents FROM invoices
                   WHERE account_id = $1 AND status <> 'void' GROUP BY job_id) inv ON inv.job_id=j.id
       LEFT JOIN (SELECT job_id, SUM(amount_cents) AS cost_cents FROM expenses
                   WHERE account_id = $1 GROUP BY job_id) exp ON exp.job_id=j.id
      WHERE j.account_id=$1 AND (inv.revenue_cents IS NOT NULL OR exp.cost_cents IS NOT NULL)`,
    [accountId]
  );
  return normalize(rows);
}

export async function profitabilityByCustomer(accountId: string): Promise<ProfitabilityDimensionRow[]> {
  const rows = await portableQuery<any>(
    `SELECT c.id AS dimension_id, c.name AS dimension_name,
            COALESCE(inv.revenue_cents,0) AS revenue_cents,
            COALESCE(exp.cost_cents,0) AS cost_cents
       FROM clients c
       LEFT JOIN (SELECT client_id, SUM(paid_cents) AS revenue_cents FROM invoices
                   WHERE account_id=$1 AND status <> 'void' GROUP BY client_id) inv ON inv.client_id=c.id
       LEFT JOIN (SELECT client_id, SUM(amount_cents) AS cost_cents FROM expenses
                   WHERE account_id=$1 GROUP BY client_id) exp ON exp.client_id=c.id
      WHERE c.account_id=$1 AND (inv.revenue_cents IS NOT NULL OR exp.cost_cents IS NOT NULL)`,
    [accountId]
  );
  return normalize(rows);
}

export async function profitabilityByService(accountId: string): Promise<ProfitabilityDimensionRow[]> {
  const rows = await portableQuery<any>(
    `SELECT COALESCE(j.job_type,'unclassified') AS dimension_id,
            COALESCE(j.job_type,'Unclassified') AS dimension_name,
            COALESCE(SUM(inv.revenue_cents),0) AS revenue_cents,
            COALESCE(SUM(exp.cost_cents),0) AS cost_cents
       FROM jobs j
       LEFT JOIN (SELECT job_id, SUM(paid_cents) AS revenue_cents FROM invoices
                   WHERE account_id=$1 AND status <> 'void' GROUP BY job_id) inv ON inv.job_id=j.id
       LEFT JOIN (SELECT job_id, SUM(amount_cents) AS cost_cents FROM expenses
                   WHERE account_id=$1 GROUP BY job_id) exp ON exp.job_id=j.id
      WHERE j.account_id=$1
      GROUP BY j.job_type`,
    [accountId]
  );
  return normalize(rows);
}
