import { describe, expect, it } from "vitest";
import { parseImport, validateRows, DATA_LIMITS } from "../src/lib/dataImport";
import { boundedQuery } from "../src/lib/dataQuery";
const buffer = (text: string) => new TextEncoder().encode(text).buffer;
describe("structured import validation", () => {
  it("handles BOM, quoted newlines, nulls, types and no-header input", async () => {
    const draft = await parseImport(
      buffer(
        '\uFEFFmonth,value,active,note\r\n2026-01-01,12.5,true,"hello,\nworld"\r\n2026-02-01,,false,end',
      ),
      "trade.csv",
    );
    expect(draft.fields.map((f) => f.type)).toEqual([
      "date",
      "number",
      "boolean",
      "text",
    ]);
    expect(draft.rows[0].note).toBe("hello,\nworld");
    expect(draft.rows[1].value).toBeNull();
    expect(
      (await parseImport(buffer("a,2\nb,3"), "data.csv", false)).rows,
    ).toHaveLength(2);
    expect(draft.fingerprint).toHaveLength(64);
  });
  it("supports flat JSON records, missing fields and safe special keys", async () => {
    const draft = await parseImport(
      buffer(
        '{"records":[{"organization":"A","value":2,"__proto__":"safe"},{"country":"B","value":3}]}',
      ),
      "data.json",
    );
    expect(draft.rows[1].organization).toBeNull();
    expect(Object.hasOwn(draft.rows[0], "__proto__")).toBe(true);
  });
  it.each([
    ['[{"x":1,"x":2}]', "x.json", "Duplicate JSON"],
    ['[{"x":9007199254740992}]', "x.json", "safe numeric"],
    ["__INDEX__\n1", "x.csv", "Reserved"],
    ["a,A\n1,2", "x.csv", "unique"],
    ["a,b\n1", "x.csv", "width"],
    ['a\n"unclosed', "x.csv", "CSV"],
    ['[{"x":{"nested":true}}]', "x.json", "Nested"],
    ["{bad", "x.json", "Malformed"],
    ["[]", "x.json", "array"],
  ])("rejects malformed import %s", async (text, filename, message) => {
    await expect(parseImport(buffer(text), filename)).rejects.toThrow(message);
  });
  it("enforces bytes, row limits, UTF-8 and explicit type edits", async () => {
    await expect(
      parseImport(new ArrayBuffer(DATA_LIMITS.fileBytes + 1), "x.csv"),
    ).rejects.toThrow("10 MiB");
    await expect(
      parseImport(new Uint8Array([0xff]).buffer, "x.csv"),
    ).rejects.toThrow("encoding");
    expect(() =>
      validateRows([{ x: "oops" }], [{ name: "x", type: "number", unit: "" }]),
    ).toThrow("Record 1, column x");
    expect(() =>
      validateRows(
        [{ x: "2026-02-30" }],
        [{ name: "x", type: "date", unit: "" }],
      ),
    ).toThrow("Expected date");
    expect(() =>
      validateRows(
        Array.from({ length: 50001 }, () => ({ x: 1 })),
        [{ name: "x", type: "number", unit: "" }],
      ),
    ).toThrow("50,000");
  });
});
describe("read-only SQL boundary", () => {
  it("wraps SELECT and CTE results with a bounded output", () => {
    expect(
      boundedQuery("SELECT 'drop; table' AS label, SUM(value) FROM dataset"),
    ).toContain("LIMIT 5001");
    expect(
      boundedQuery("WITH x AS (SELECT * FROM dataset) SELECT * FROM x"),
    ).toContain("foundation_result");
  });
  it.each([
    "DELETE FROM dataset",
    "SELECT 1; SELECT 2",
    "SELECT * FROM read_csv('https://example.com')",
    "SELECT * FROM query_table('dataset')",
    "SELECT 1 -- extra",
    "CALL test()",
    "SELECT * FROM sqlite_scan('a','b')",
  ])("blocks %s", (sql) => expect(() => boundedQuery(sql)).toThrow());
});
