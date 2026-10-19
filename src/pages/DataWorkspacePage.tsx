import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DatasetImport } from "../components/DatasetImport";
import type { ExplorerHandle } from "../components/DataExplorer";
import { Button } from "../components/ui/Button";
import { Input, controlClass } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  authorizeDataScope,
  emptyWorkspace,
  readPersisted,
  readSession,
  validateWorkspace,
  writePersisted,
  writeSession,
} from "../services/dataWorkspaceService";
import {
  AnalyticalEngine,
  type QueryResult,
} from "../services/analyticalService";
import { quoteColumn } from "../lib/dataQuery";
import { downloadAnalysis } from "../lib/dataDownload";
import type {
  Analysis,
  DataScope,
  Dataset,
  LocalWorkspace,
} from "../types/dataset";

const DataExplorer = lazy(() =>
  import("../components/DataExplorer").then((module) => ({
    default: module.DataExplorer,
  })),
);
const initialSql = "SELECT * FROM dataset";
export default function DataWorkspacePage() {
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<DataScope | null>(null);
  const [stored, setStored] = useState<LocalWorkspace>(emptyWorkspace);
  const [session, setSession] = useState<LocalWorkspace>(emptyWorkspace);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sql, setSql] = useState(initialSql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | undefined>();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState("");
  const [note, setNote] = useState("");
  const [freeze, setFreeze] = useState(false);
  const [opened, setOpened] = useState<Analysis | null>(null);
  const explorer = useRef<ExplorerHandle | null>(null);
  const engine = useRef(new AnalyticalEngine());
  const generation = useRef(0);
  const allDatasets = [...stored.datasets, ...session.datasets];
  const selected = allDatasets.find((d) => d.id === params.get("dataset"));
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const authorized = await authorizeDataScope();
        if (!active) return;
        setScope(authorized);
        setSession(readSession(authorized));
        try {
          const local = await readPersisted(authorized);
          if (active) {
            setStored(local);
            setStorageReady(true);
          }
        } catch (e) {
          if (active) setStorageError((e as Error).message);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    const currentEngine = engine.current;
    return () => {
      active = false;
      currentEngine.cancel();
    };
  }, []);
  function reset(id: string) {
    generation.current++;
    engine.current.cancel();
    setBusy(false);
    setParams(id ? { dataset: id } : {});
    setResult(null);
    setConfig(undefined);
    setSql(initialSql);
    setOpened(null);
    setError("");
  }
  async function persist(next: LocalWorkspace) {
    if (!scope || !storageReady)
      throw new Error(
        "Browser storage unavailable. Keep working in the session or restore storage access and reload.",
      );
    // Re-check current server project authorization before every durable operation.
    const current = await authorizeDataScope();
    if (current.owner !== scope.owner || current.project !== scope.project)
      throw new Error("Workspace changed. Reload before saving.");
    const saved = await writePersisted(scope, next);
    setStored(saved);
  }
  async function action(work: () => Promise<void>) {
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function run(query = sql) {
    if (!selected) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const output = await engine.current.run(selected, query);
      if (generation.current === current) {
        setResult(output);
        setConfig(undefined);
        setOpened(null);
        setNotice(
          "Calculated SQL results ready. Source records are unchanged.",
        );
      }
    } catch (e) {
      if (generation.current === current) setError((e as Error).message);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }
  async function importDataset(dataset: Dataset, durable: boolean) {
    if (!scope) throw new Error("Project access is unavailable.");
    const duplicate = allDatasets.find(
      (d) => d.fingerprint === dataset.fingerprint,
    );
    if (duplicate)
      throw new Error(
        `This file is already imported as "${duplicate.name}". Open that dataset or remove it before reimporting.`,
      );
    if (durable)
      await persist({ ...stored, datasets: [...stored.datasets, dataset] });
    else {
      const next = { ...session, datasets: [...session.datasets, dataset] };
      validateWorkspace(next);
      writeSession(scope, next);
      setSession(next);
    }
    reset(dataset.id);
    setNotice(
      `Imported ${dataset.name}. ${durable ? "Saved in this browser." : "Session only; save locally to survive reload."}`,
    );
  }
  const visible =
    result ??
    (opened?.snapshot
      ? { ...opened.snapshot, sql: opened.sql }
      : selected
        ? { rows: selected.rows, fields: selected.fields }
        : null);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-blue-300">
          Project research · local analysis
        </p>
        <h1 className="text-3xl font-semibold">Data Workspace</h1>
        <p className="mt-2 text-slate-400">
          Explore structured evidence, run analytical SQL and preserve useful
          views. No AI or data uploads.
        </p>
      </header>
      {storageError && (
        <p role="status" className="rounded border border-amber-700 p-3">
          {storageError} Browser saving is disabled; session-only imports still
          work.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded border border-red-800 p-3 text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-blue-200">
          {notice}
        </p>
      )}
      {!scope ? (
        <p>Checking project access…</p>
      ) : (
        <>
          <DatasetImport onImport={importDataset} />
          <section className="space-y-3" aria-label="Project datasets">
            <h2 className="text-xl">Datasets</h2>
            <label>
              Open dataset
              <select
                aria-label="Open dataset"
                className={controlClass}
                value={selected?.id ?? ""}
                onChange={(e) => reset(e.target.value)}
              >
                <option value="">Choose a dataset</option>
                {allDatasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ·{" "}
                    {stored.datasets.some((s) => s.id === d.id)
                      ? "browser saved"
                      : "session only"}
                  </option>
                ))}
              </select>
            </label>
            {!allDatasets.length && (
              <p className="text-slate-400">
                Import your first CSV or JSON to begin. Saved analyses appear
                below even when their source data is unavailable.
              </p>
            )}
            {params.get("dataset") && !selected && (
              <p role="status">
                Source dataset unavailable on this device or in this project.
                Reimport the original file, or inspect a frozen snapshot below.
              </p>
            )}
          </section>
          {selected && (
            <section className="space-y-3 rounded-xl border border-slate-700 p-4">
              <h2 className="text-xl">{selected.name}</h2>
              <p>
                {selected.rows.length.toLocaleString()} source records ·{" "}
                {selected.filename} · imported{" "}
                {new Date(selected.importedAt).toLocaleString()}
              </p>
              <p className="break-words">Source: {selected.source}</p>
              <p className="whitespace-pre-wrap break-words text-slate-400">
                {selected.provenance}
              </p>
              <p className="break-words text-sm text-slate-400">
                Fields:{" "}
                {selected.fields
                  .map(
                    (f) =>
                      `${f.name} (${f.type}${f.unit ? `, ${f.unit}` : ""})`,
                  )
                  .join(" · ")}
              </p>
              <div className="flex flex-wrap gap-2">
                {!stored.datasets.some((d) => d.id === selected.id) && (
                  <Button
                    disabled={saving || !storageReady}
                    onClick={() =>
                      void action(async () => {
                        await persist({
                          ...stored,
                          datasets: [...stored.datasets, selected],
                        });
                        const next = {
                          ...session,
                          datasets: session.datasets.filter(
                            (d) => d.id !== selected.id,
                          ),
                        };
                        writeSession(scope, next);
                        setSession(next);
                        setNotice("Dataset saved in this browser.");
                      })
                    }
                  >
                    Save dataset in browser
                  </Button>
                )}
                <Button
                  disabled={saving}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${selected.name}? Saved analysis definitions and frozen snapshots will remain. This cannot be undone.`,
                      )
                    )
                      void action(async () => {
                        if (stored.datasets.some((d) => d.id === selected.id))
                          await persist({
                            ...stored,
                            datasets: stored.datasets.filter(
                              (d) => d.id !== selected.id,
                            ),
                          });
                        const next = {
                          ...session,
                          datasets: session.datasets.filter(
                            (d) => d.id !== selected.id,
                          ),
                        };
                        writeSession(scope, next);
                        setSession(next);
                        reset("");
                      });
                  }}
                >
                  Delete dataset
                </Button>
              </div>
            </section>
          )}
          {selected && (
            <section
              className="space-y-3 rounded-xl border border-slate-700 p-4"
              aria-label="SQL analysis"
            >
              <h2 className="text-xl">Analytical SQL</h2>
              <Textarea
                label="SQL query"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                hint="Read-only SELECT or WITH … SELECT against dataset. Results capped at 5,000 rows / 10 MiB; 30-second worker timeout. No external readers or database connections."
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void run()}>
                  Run query
                </Button>
                <Button
                  disabled={!busy}
                  onClick={() => engine.current.cancel()}
                >
                  Interrupt analysis
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setSql("SELECT COUNT(*) AS record_count FROM dataset");
                  }}
                >
                  Count records
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    const dimension =
                      selected.fields.find((f) => f.type === "date") ??
                      selected.fields.find((f) => f.type === "text");
                    const measure = selected.fields.find(
                      (f) => f.type === "number",
                    );
                    if (dimension && measure)
                      setSql(
                        `SELECT ${quoteColumn(dimension.name)}, SUM(${quoteColumn(measure.name)}) AS total FROM dataset GROUP BY 1 ORDER BY 1`,
                      );
                    else
                      setError(
                        "Totals need a date/text dimension and numeric field.",
                      );
                  }}
                >
                  Prepare grouped totals
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setResult(null);
                    setConfig(undefined);
                    setOpened(null);
                  }}
                >
                  Show source records
                </Button>
              </div>
              {busy && <p role="status">Running local analysis…</p>}
            </section>
          )}
          {visible && (
            <section className="space-y-4" aria-label="Current analytical view">
              <h2 className="text-xl">
                {result
                  ? "Calculated SQL results"
                  : opened?.snapshot
                    ? "Frozen result snapshot"
                    : "Source records"}
              </h2>
              <p>
                {visible.rows.length.toLocaleString()} rows
                {"truncated" in visible && visible.truncated
                  ? " · truncated at 5,000 rows"
                  : ""}
                {opened?.snapshot && !result
                  ? ` · captured ${new Date(opened.snapshot.capturedAt).toLocaleString()}`
                  : ""}
              </p>
              <Suspense fallback={<p>Loading visualization tools…</p>}>
                <DataExplorer
                  key={`${selected?.id ?? "snapshot"}:${opened?.id ?? ""}:${result?.sql ?? "source"}`}
                  rows={visible.rows}
                  fields={visible.fields}
                  config={config}
                  ref={explorer}
                />
              </Suspense>
              {selected && (
                <section className="space-y-3 rounded-xl border border-slate-700 p-4">
                  <h3 className="text-lg">Save analytical work</h3>
                  <Input
                    label="Analysis name"
                    value={viewName}
                    maxLength={100}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                  <Textarea
                    label="Analyst note"
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={freeze}
                      onChange={(e) => setFreeze(e.target.checked)}
                    />
                    Include frozen result snapshot (up to 5,000 displayed input
                    rows, not the rendered pivot)
                  </label>
                  <p className="text-sm text-slate-400">
                    Saves this browser's query and visualization definition.
                    Without a snapshot, results require the original dataset.
                    Unsaved SQL editor text is not included; run the query
                    first.
                  </p>
                  <Button
                    disabled={
                      saving || busy || !storageReady || !viewName.trim()
                    }
                    onClick={() =>
                      void action(async () => {
                        if (!explorer.current)
                          throw new Error(
                            "Wait for the explorer to finish loading.",
                          );
                        const definition: Analysis = {
                          id: crypto.randomUUID(),
                          name: viewName.trim(),
                          datasetId: selected.id,
                          datasetName: selected.name,
                          fingerprint: selected.fingerprint,
                          source: {
                            attribution: selected.source,
                            filename: selected.filename,
                            provenance: selected.provenance,
                            importedAt: selected.importedAt,
                            fields: selected.fields,
                          },
                          sql: result?.sql ?? opened?.sql ?? initialSql,
                          config: await explorer.current.save(),
                          note,
                          createdAt: new Date().toISOString(),
                          ...(freeze
                            ? {
                                snapshot: {
                                  rows: visible.rows.slice(0, 5000),
                                  fields: visible.fields,
                                  capturedAt: new Date().toISOString(),
                                  truncated:
                                    visible.rows.length > 5000 ||
                                    ("truncated" in visible &&
                                      visible.truncated === true),
                                },
                              }
                            : {}),
                        };
                        await persist({
                          ...stored,
                          analyses: [...stored.analyses, definition],
                        });
                        setNotice("Analysis definition saved in this browser.");
                      })
                    }
                  >
                    Save analysis in browser
                  </Button>
                </section>
              )}
            </section>
          )}
          <section className="space-y-3" aria-label="Saved analyses">
            <h2 className="text-xl">Saved analytical work</h2>
            {!stored.analyses.length && (
              <p className="text-slate-400">
                No saved analyses in this project's browser storage.
              </p>
            )}
            {stored.analyses.map((a) => (
              <article
                key={a.id}
                className="space-y-2 rounded-xl border border-slate-700 p-4"
              >
                <h3 className="font-semibold">{a.name}</h3>
                <p className="text-sm">
                  {a.datasetName} ·{" "}
                  {a.snapshot
                    ? "definition + frozen snapshot"
                    : "definition only; results are not stored"}
                </p>
                <p className="whitespace-pre-wrap break-words text-slate-400">
                  {a.note}
                </p>
                <p className="break-words text-sm text-slate-400">
                  Source: {a.source.attribution} · {a.source.filename} ·
                  analysis saved {new Date(a.createdAt).toLocaleString()}
                </p>
                {a.source.provenance && (
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-400">
                    {a.source.provenance}
                  </p>
                )}
                <pre className="overflow-auto text-sm">{a.sql}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy || saving}
                    onClick={() =>
                      void action(async () => {
                        const dataset =
                          allDatasets.find((d) => d.id === a.datasetId) ??
                          allDatasets.find(
                            (d) => d.fingerprint === a.fingerprint && JSON.stringify(d.fields) === JSON.stringify(a.source.fields),
                          );
                        reset(dataset?.id ?? a.datasetId);
                        setSql(a.sql);
                        setViewName(a.name);
                        setNote(a.note);
                        if (dataset) {
                          setBusy(true);
                          try {
                            const output = await engine.current.run(
                              dataset,
                              a.sql,
                            );
                            setResult(output);
                            setConfig(a.config);
                            setOpened(a);
                          } finally {
                            setBusy(false);
                          }
                        } else {
                          setOpened(a);
                          setConfig(a.config);
                          setNotice(
                            a.snapshot
                              ? "Source unavailable. Showing frozen snapshot; it does not refresh."
                              : "Source unavailable. Reimport the original file to rerun this definition.",
                          );
                        }
                      })
                    }
                  >
                    Open analysis
                  </Button>
                  {a.snapshot && (
                    <Button
                      onClick={() => {
                        reset(a.datasetId);
                        setOpened(a);
                        setConfig(a.config);
                      }}
                    >
                      Inspect frozen snapshot
                    </Button>
                  )}
                  <Button onClick={() => downloadAnalysis(a)}>
                    Download analysis JSON
                  </Button>
                  <Button
                    disabled={saving}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete saved analysis "${a.name}" and its snapshot?`,
                        )
                      )
                        void action(async () => {
                          await persist({
                            ...stored,
                            analyses: stored.analyses.filter(
                              (v) => v.id !== a.id,
                            ),
                          });
                        });
                    }}
                  >
                    Delete analysis
                  </Button>
                </div>
              </article>
            ))}
          </section>
          <p className="text-sm text-slate-400">
            Storage: this browser and origin only. Original file bytes are not
            retained; validated rows and provenance are saved. No cloud backup,
            cross-device sync or shared-device privacy guarantee. Clearing site
            data removes local work. Local saves in other tabs require a reload
            before editing.
          </p>
        </>
      )}
    </div>
  );
}
