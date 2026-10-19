import { DATA_LIMITS } from "./dataImport";
export const quoteColumn = (name: string) => `"${name.replaceAll('"', '""')}"`;
// Defense in depth; the engine additionally disables external access and extensions.
export function boundedQuery(sql: string) {
  if (sql.length > 20000 || !/^\s*(select|with)\b/i.test(sql))
    throw new Error(
      "Use a single SELECT or WITH … SELECT query against dataset.",
    );
  // Strip literals/quoted identifiers before rejecting statements and external functions.
  const tokens = sql
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:""|[^"])*"/g, '""');
  if (
    /[;]|--|\/\*|\$/.test(tokens) ||
    /\b(insert|update|delete|create|drop|alter|attach|detach|copy|call|pragma|set|reset|install|load|export|import|read_\w+|\w+_scan|http\w*|sqlite\w*|postgres\w*|query|query_table)\b/i.test(
      tokens,
    )
  )
    throw new Error(
      "Only local read-only analysis is allowed. Remove extra statements, comments or external readers.",
    );
  return `SELECT * FROM (${sql}) AS foundation_result LIMIT ${DATA_LIMITS.resultRows + 1}`;
}
