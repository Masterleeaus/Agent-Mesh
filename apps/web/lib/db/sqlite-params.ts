/** Expand numbered SQL bindings in placeholder order for better-sqlite3. */
export function rewriteSqliteParams(text: string, params: readonly unknown[] = []): { sql: string; params: unknown[] } {
  const bound: unknown[] = [];
  const sql = text.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
    const index = Number(rawIndex) - 1;
    if (index < 0 || index >= params.length) throw new Error(`SQLite parameter $${rawIndex} is not bound`);
    bound.push(params[index]);
    return "?";
  });
  return { sql, params: bound };
}
