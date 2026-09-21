import { execFileSync } from "node:child_process";
const patterns = ["RETURNING", "ON CONFLICT", "::", "ILIKE", "ANY(", "jsonb", "set_config", "gen_random_uuid"];
console.log("Titan DB portability audit (remaining PostgreSQL-specific source files)");
for (const pattern of patterns) {
  let output = "";
  try {
    output = execFileSync("grep", ["-RIlF", "--include=*.ts", "--include=*.sql", pattern, "apps", "db/migrations"], { encoding: "utf8" });
  } catch (error) {
    output = error?.stdout?.toString?.() ?? "";
  }
  const files = output.trim() ? output.trim().split("\n") : [];
  console.log(`${pattern.padEnd(18)} ${files.length}`);
}
