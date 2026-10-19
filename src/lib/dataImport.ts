import Papa from "papaparse";
import type {
  Cell,
  DataField,
  DataRow,
  FieldType,
  ImportDraft,
} from "../types/dataset";

export const DATA_LIMITS = {
  fileBytes: 10 * 1024 * 1024,
  rows: 50000,
  fields: 80,
  cellChars: 10000,
  workspaceBytes: 40 * 1024 * 1024,
  datasets: 12,
  analyses: 50,
  resultRows: 5000,
};
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value: string) {
  return (
    datePattern.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function convertCell(value: Cell | undefined, type: FieldType): Cell {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value);
  if (text.length > DATA_LIMITS.cellChars)
    throw new Error("Cell exceeds 10,000 characters.");
  if (type === "text") return text;
  if (
    type === "number" &&
    /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(text) &&
    Number.isFinite(Number(text))
  )
    return Number(text);
  if (type === "boolean" && /^(true|false)$/i.test(text))
    return text.toLowerCase() === "true";
  if (type === "date" && validDate(text)) return text;
  throw new Error(
    `Expected ${type}; found "${text.slice(0, 60)}". Choose Text to preserve mixed values.`,
  );
}
function infer(values: Cell[]): FieldType {
  const present = values.filter((v) => v !== null && v !== "");
  if (!present.length) return "text";
  for (const type of ["boolean", "number", "date"] as const) {
    if (
      type === "number" &&
      present.some(
        (v) =>
          /^[-+]?0\d/.test(String(v)) ||
          (/^[-+]?\d+$/.test(String(v)) && !Number.isSafeInteger(Number(v))),
      )
    )
      continue;
    try {
      present.forEach((v) => convertCell(v, type));
      return type;
    } catch {
      /* Try another type. */
    }
  }
  return "text";
}
// JSON.parse silently discards duplicate object keys; reject them before import.
function rejectDuplicateJsonKeys(text: string) {
  const stack: (Set<string> | null)[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") stack.push(new Set());
    else if (text[i] === "[") stack.push(null);
    else if (text[i] === "}" || text[i] === "]") stack.pop();
    else if (text[i] === '"') {
      const start = i++;
      while (i < text.length) {
        if (text[i] === "\\") i += 2;
        else if (text[i] === '"') break;
        else i++;
      }
      if (/^\s*:/.test(text.slice(i + 1))) {
        const key = JSON.parse(text.slice(start, i + 1)) as string;
        const keys = stack.at(-1);
        if (keys?.has(key))
          throw new Error(
            `Duplicate JSON field "${key}". Rename or remove repeated keys.`,
          );
        keys?.add(key);
      }
    }
  }
}
export function validateRows(rows: DataRow[], fields: DataField[]): DataRow[] {
  if (!rows.length || rows.length > DATA_LIMITS.rows)
    throw new Error("Import requires 1–50,000 records.");
  if (!fields.length || fields.length > DATA_LIMITS.fields)
    throw new Error("Import requires 1–80 columns.");
  const names = fields.map((f) => f.name.toLowerCase());
  if (
    names.some((name) => ["__index__", "__row_path__", "__id__"].includes(name))
  )
    throw new Error(
      "Reserved analytical column name. Rename __INDEX__, __ROW_PATH__ or __ID__ before importing.",
    );
  if (
    new Set(names).size !== names.length ||
    fields.some(
      (f) =>
        !f.name.trim() ||
        f.name.length > 100 ||
        [...f.name].some((c) => c.charCodeAt(0) < 32),
    )
  )
    throw new Error(
      "Column names must be unique (ignoring case), nonempty and at most 100 characters.",
    );
  return rows.map((row, i) =>
    Object.fromEntries(
      fields.map((field) => {
        try {
          return [field.name, convertCell(row[field.name], field.type)];
        } catch (e) {
          throw new Error(
            `Record ${i + 1}, column ${field.name}: ${(e as Error).message}`,
            { cause: e },
          );
        }
      }),
    ),
  );
}
export async function parseImport(
  buffer: ArrayBuffer,
  filename: string,
  headers = true,
): Promise<ImportDraft> {
  if (buffer.byteLength > DATA_LIMITS.fileBytes)
    throw new Error(
      "File exceeds the 10 MiB import limit. Split it before importing.",
    );
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true })
      .decode(buffer)
      .replace(/^\uFEFF/, "");
  } catch {
    throw new Error(
      "Unsupported encoding. Export the file as UTF-8 CSV or JSON.",
    );
  }
  let rows: DataRow[];
  let names: string[];
  if (/\.csv$/i.test(filename)) {
    const parsed = Papa.parse<string[]>(text, {
      delimiter: ",",
      skipEmptyLines: "greedy",
    });
    if (parsed.errors.length)
      throw new Error(`CSV: ${parsed.errors[0].message}`);
    const records = parsed.data;
    if (!records.length) throw new Error("File contains no records.");
    names = headers
      ? records.shift()!.map((v) => v.trim())
      : records[0].map((_, i) => `column_${i + 1}`);
    if (records.some((r) => r.length !== names.length))
      throw new Error(
        "CSV record width differs from its columns. Check delimiters and quoted values.",
      );
    rows = records.map((r) =>
      Object.fromEntries(names.map((n, i) => [n, r[i]])),
    );
  } else if (/\.json$/i.test(filename)) {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error(
        'Malformed JSON. Provide an array of flat objects or {"records": [...]}.',
      );
    }
    rejectDuplicateJsonKeys(text);
    if (value && typeof value === "object" && !Array.isArray(value))
      value = (value as { records?: unknown }).records;
    if (
      !Array.isArray(value) ||
      !value.length ||
      value.some((v) => !v || typeof v !== "object" || Array.isArray(v))
    )
      throw new Error(
        'JSON must contain an array of flat record objects (optionally inside "records").',
      );
    names = [...new Set(value.flatMap((v) => Object.keys(v)))];
    rows = value as DataRow[];
    if (
      rows.some((r) =>
        Object.values(r).some(
          (v) =>
            typeof v === "number" &&
            (!Number.isFinite(v) ||
              (Number.isInteger(v) && !Number.isSafeInteger(v))),
        ),
      )
    )
      throw new Error(
        "JSON number is outside safe numeric precision. Encode large identifiers as quoted text.",
      );
    if (
      rows.some((r) =>
        Object.values(r).some(
          (v) =>
            v !== null && !["string", "number", "boolean"].includes(typeof v),
        ),
      )
    )
      throw new Error(
        "Nested arrays/objects are unsupported. Flatten records before importing.",
      );
  } else throw new Error("Choose a .csv or .json file.");
  const fields = names.map((name) => ({
    name,
    type: infer(rows.map((r) => r[name] ?? null)),
    unit: "",
  }));
  rows = validateRows(rows, fields);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return {
    fields,
    rows,
    filename,
    bytes: buffer.byteLength,
    fingerprint: Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
