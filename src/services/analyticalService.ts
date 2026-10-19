import * as duckdb from "@duckdb/duckdb-wasm";
import wasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import workerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { boundedQuery, quoteColumn } from "../lib/dataQuery";
import { DATA_LIMITS } from "../lib/dataImport";
import type { DataField, DataRow, Dataset } from "../types/dataset";

export type QueryResult = {
  rows: DataRow[];
  fields: DataField[];
  truncated: boolean;
  sql: string;
};
export class AnalyticalEngine {
  private worker: Worker | null = null;
  private rejectOperation: ((error: Error) => void) | null = null;
  private running = false;
  cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.rejectOperation?.(
      new Error(
        "Analysis interrupted. Source data is unchanged; you can run it again.",
      ),
    );
  }
  async run(dataset: Dataset, sql: string): Promise<QueryResult> {
    if (this.running) throw new Error("An analysis is already running.");
    const bounded = boundedQuery(sql);
    this.running = true;
    const operation = new Promise<never>((_, reject) => {
      this.rejectOperation = reject;
    });
    const timer = setTimeout(() => this.cancel(), 30000);
    const worker = new Worker(workerUrl);
    this.worker = worker;
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
    try {
      return await Promise.race([
        operation,
        (async () => {
          await db.instantiate(wasm);
          await db.open({ maximumThreads: 1 });
          const connection = await db.connect();
          await connection.query(
            "SET autoinstall_known_extensions=false; SET autoload_known_extensions=false; SET enable_external_access=false; SET memory_limit='256MB'; SET threads=1",
          );
          const types = {
            text: "VARCHAR",
            number: "DOUBLE",
            boolean: "BOOLEAN",
            date: "DATE",
          };
          await connection.query(
            `CREATE TABLE dataset (${dataset.fields.map((f) => `${quoteColumn(f.name)} ${types[f.type]}`).join(",")})`,
          );
          for (let offset = 0; offset < dataset.rows.length; offset += 250) {
            const values = dataset.rows
              .slice(offset, offset + 250)
              .map(
                (row) =>
                  `(${dataset.fields
                    .map((f) => {
                      const value = row[f.name];
                      return value === null
                        ? "NULL"
                        : typeof value === "string"
                          ? `'${value.replaceAll("'", "''")}'`
                          : String(value);
                    })
                    .join(",")})`,
              )
              .join(",");
            await connection.query(`INSERT INTO dataset VALUES ${values}`);
          }
          await connection.query("SET lock_configuration=true");
          const table = await connection.query(bounded);
          if (table.schema.fields.length > DATA_LIMITS.fields)
            throw new Error(
              "Query returned more than 80 columns. Select fewer fields.",
            );
          const fields: DataField[] = table.schema.fields.map((f) => {
            const type = String(f.type);
            return {
              name: f.name,
              type: /Bool/.test(type)
                ? "boolean"
                : /Date/.test(type)
                  ? "date"
                  : /Int|Float|Decimal/.test(type)
                    ? "number"
                    : "text",
              unit: "",
            };
          });
          if (
            new Set(fields.map((f) => f.name.toLowerCase())).size !==
            fields.length
          )
            throw new Error(
              "Query columns must have unique names. Add distinct AS aliases.",
            );
          const rows = table
            .toArray()
            .slice(0, DATA_LIMITS.resultRows)
            .map((row) =>
              Object.fromEntries(
                fields.map((f) => {
                  const value = row[f.name];
                  if (
                    value != null &&
                    f.type === "number" &&
                    (!Number.isFinite(Number(value)) ||
                      (typeof value === "bigint" &&
                        !Number.isSafeInteger(Number(value))))
                  )
                    throw new Error(
                      "Numeric result exceeds safe display precision. CAST this value AS VARCHAR in SQL to preserve its exact text.",
                    );
                  return [
                    f.name,
                    value == null
                      ? null
                      : f.type === "number"
                        ? Number(value)
                        : f.type === "boolean"
                          ? Boolean(value)
                          : f.type === "date"
                            ? new Date(Number(value)).toISOString().slice(0, 10)
                            : String(value),
                  ];
                }),
              ),
            );
          if (new Blob([JSON.stringify(rows)]).size > 10 * 1024 * 1024)
            throw new Error(
              "Results exceed 10 MiB. Select fewer columns or use an aggregate.",
            );
          return {
            rows,
            fields,
            truncated: table.numRows > DATA_LIMITS.resultRows,
            sql,
          };
        })(),
      ]);
    } finally {
      clearTimeout(timer);
      worker.terminate();
      if (this.worker === worker) this.worker = null;
      this.rejectOperation = null;
      this.running = false;
    }
  }
}
