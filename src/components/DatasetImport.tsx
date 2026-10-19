import { useRef, useState } from "react";
import { DATA_LIMITS, parseImport, validateRows } from "../lib/dataImport";
import type { Dataset, FieldType, ImportDraft } from "../types/dataset";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

export function DatasetImport({
  onImport,
}: {
  onImport: (dataset: Dataset, persist: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [provenance, setProvenance] = useState("");
  const [headers, setHeaders] = useState(true);
  const [persist, setPersist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  return (
    <section
      className="space-y-4 rounded-xl border border-slate-700 p-4"
      aria-label="Import dataset"
    >
      <h2 className="text-lg font-semibold">Import structured data</h2>
      <p className="text-sm text-slate-400">
        Choose → inspect fields → validate and import → explore. UTF-8 CSV
        (comma-separated) or flat JSON; up to 10 MiB, 50,000 records and 80
        columns. Files stay on this device.
      </p>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={headers}
          disabled={!!draft || busy}
          onChange={(e) => setHeaders(e.target.checked)}
        />
        CSV first row contains headers
      </label>
      <Input
        label="Dataset file"
        type="file"
        accept=".csv,.json"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          const current = ++generation.current;
          setDraft(null);
          setError("");
          if (!file) return;
          if (file.size > DATA_LIMITS.fileBytes) {
            setError(
              "File exceeds the 10 MiB import limit. Split it before importing.",
            );
            return;
          }
          setBusy(true);
          try {
            const next = await parseImport(
              await file.arrayBuffer(),
              file.name,
              headers,
            );
            if (generation.current === current) {
              setDraft(next);
              setName(file.name.replace(/\.[^.]+$/, ""));
            }
          } catch (e) {
            if (generation.current === current) setError((e as Error).message);
          } finally {
            if (generation.current === current) setBusy(false);
          }
        }}
      />
      {draft && (
        <>
          <p className="text-sm text-slate-400">
            Numbers use double precision. Keep identifiers and exact decimal
            amounts as Text when rounding would matter.
          </p>
          <p>
            {draft.rows.length.toLocaleString()} records · {draft.fields.length}{" "}
            columns · empty/missing values become null
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Dataset name"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Source attribution"
              value={source}
              maxLength={500}
              onChange={(e) => setSource(e.target.value)}
              hint="Publisher, source URL or fictional fixture name"
            />
          </div>
          <Textarea
            label="Provenance / import notes"
            value={provenance}
            maxLength={2000}
            onChange={(e) => setProvenance(e.target.value)}
          />
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Unit</th>
                  <th>Sample</th>
                </tr>
              </thead>
              <tbody>
                {draft.fields.map((f, i) => (
                  <tr key={f.name}>
                    <th className="max-w-48 break-words p-2">{f.name}</th>
                    <td className="p-2">
                      <select
                        className={controlClass}
                        aria-label={`Type for ${f.name}`}
                        value={f.type}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fields: draft.fields.map((field, index) =>
                              index === i
                                ? {
                                    ...field,
                                    type: e.target.value as FieldType,
                                  }
                                : field,
                            ),
                          })
                        }
                      >
                        {["text", "number", "boolean", "date"].map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        className={controlClass}
                        aria-label={`Unit for ${f.name}`}
                        value={f.unit}
                        maxLength={50}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fields: draft.fields.map((field, index) =>
                              index === i
                                ? { ...field, unit: e.target.value }
                                : field,
                            ),
                          })
                        }
                      />
                    </td>
                    <td className="max-w-48 truncate p-2">
                      {draft.rows
                        .slice(0, 3)
                        .map((r) => String(r[f.name] ?? "null"))
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
            />
            Persist dataset in this browser (IndexedDB)
          </label>
          <p className="text-sm text-slate-400">
            Session-only data lasts until reload or sign-out. Browser saves can
            be evicted or read by other users of this browser profile; they are
            not a backup or cloud sync.
          </p>
          <Button
            disabled={busy || !name.trim() || !source.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const rows = validateRows(draft.rows, draft.fields);
                await onImport(
                  {
                    ...draft,
                    rows,
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    source: source.trim(),
                    provenance,
                    importedAt: new Date().toISOString(),
                  },
                  persist,
                );
                setDraft(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Validate and import
          </Button>
        </>
      )}
      {(draft || busy) && (
        <Button
          onClick={() => {
            generation.current++;
            setDraft(null);
            setBusy(false);
            setError("");
          }}
        >
          Cancel import
        </Button>
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
