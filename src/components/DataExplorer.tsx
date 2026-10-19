import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import perspective from "@perspective-dev/client";
import perspectiveViewer, {
  type HTMLPerspectiveViewerElement,
  type ViewerConfigUpdate,
} from "@perspective-dev/viewer";
import "@perspective-dev/viewer-datagrid";
import "@perspective-dev/viewer-charts";
import "@perspective-dev/viewer/dist/css/pro-dark.css";
import serverWasm from "@perspective-dev/server/dist/wasm/perspective-server.wasm?url";
import viewerWasm from "@perspective-dev/viewer/dist/wasm/perspective-viewer.wasm?url";
import type { DataField, DataRow } from "../types/dataset";
import { Button } from "./ui/Button";
import { controlClass } from "./ui/Input";

let initialized: Promise<void> | undefined;
function initialize() {
  if (initialized) return initialized;
  perspective.init_server(() => fetch(serverWasm));
  initialized = perspectiveViewer
    .init_client(fetch(viewerWasm))
    .catch((error) => {
      initialized = undefined;
      throw error;
    });
  return initialized;
}
export type ExplorerHandle = { save: () => Promise<Record<string, unknown>> };
export function DataExplorer({
  rows,
  fields,
  config,
  ref,
}: {
  rows: DataRow[];
  fields: DataField[];
  config?: Record<string, unknown>;
  ref: Ref<ExplorerHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLPerspectiveViewerElement | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState("Starting visualization worker");
  const [group, setGroup] = useState(
    Array.isArray(config?.group_by) && typeof config.group_by[0] === "string"
      ? config.group_by[0]
      : "",
  );
  const savedColumns = Array.isArray(config?.columns) ? config.columns : [];
  const [measure, setMeasure] = useState(
    typeof savedColumns[0] === "string" &&
      fields.some((f) => f.name === savedColumns[0] && f.type === "number")
      ? savedColumns[0]
      : (fields.find((f) => f.type === "number")?.name ?? ""),
  );
  const [plugin, setPlugin] = useState(
    typeof config?.plugin === "string" ? config.plugin : "Datagrid",
  );
  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!viewer.current || !ready)
          throw new Error("Wait for the explorer to finish loading.");
        return (await viewer.current.save()) as Record<string, unknown>;
      },
    }),
    [ready],
  );
  useEffect(() => {
    let disposed = false;
    const element = document.createElement(
      "perspective-viewer",
    ) as HTMLPerspectiveViewerElement;
    element.style.cssText =
      "display:block;height:560px;width:100%;min-width:0;";
    element.setAttribute("theme", "Pro Dark");
    element.setAttribute("aria-label", "Interactive data exploration");
    host.current!.append(element);
    viewer.current = element;
    const load = (async () => {
      await initialize();
      const client = await perspective.worker();
      if (!disposed) setStage("Creating typed table");
      let table;
      try {
        const types = {
          text: "string",
          number: "float",
          boolean: "boolean",
          date: "date",
        } as const;
        table = await client.table(
          Object.fromEntries(fields.map((f) => [f.name, types[f.type]])),
          { name: "workspace_data" },
        );
        await table.update(rows);
        if (!disposed) setStage("Loading interactive view");
        if (!disposed) {
          await element.load(client);
          if (!disposed) setStage("Restoring visualization");
          await element.restore({
            ...config,
            table: "workspace_data",
            theme: "Pro Dark",
            settings: false,
          } as ViewerConfigUpdate);
          setReady(true);
        }
        return { client, table };
      } catch (e) {
        try {
          await element.delete();
        } catch {
          /* A failed load may have no view. */
        }
        try {
          await table?.delete();
        } finally {
          client.terminate();
        }
        throw e;
      }
    })();
    void load.catch((e) => {
      if (!disposed) setError(String(e));
    });
    return () => {
      disposed = true;
      viewer.current = null;
      element.remove();
      void load
        .then(async ({ client, table }) => {
          try {
            await element.delete();
          } finally {
            try {
              await table.delete();
            } finally {
              client.terminate();
            }
          }
        })
        .catch(() => {});
    };
  }, [rows, fields, config]);
  async function apply(reset = false) {
    try {
      setError("");
      if (reset) {
        await viewer.current?.reset();
        setGroup("");
        setPlugin("Datagrid");
        setMeasure(fields.find((f) => f.type === "number")?.name ?? "");
      } else
        await viewer.current?.restore({
          plugin,
          group_by: group ? [group] : [],
          columns: measure && group ? [measure] : fields.map((f) => f.name),
          aggregates: measure ? { [measure]: "sum" } : {},
        });
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <section className="min-w-0 space-y-3" aria-label="Data explorer">
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          Group by
          <select
            aria-label="Group by"
            className={controlClass}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">No grouping</option>
            {fields.map((f) => (
              <option key={f.name}>{f.name}</option>
            ))}
          </select>
        </label>
        <label>
          Sum field
          <select
            aria-label="Sum field"
            className={controlClass}
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
          >
            <option value="">All fields</option>
            {fields
              .filter((f) => f.type === "number")
              .map((f) => (
                <option key={f.name}>{f.name}</option>
              ))}
          </select>
        </label>
        <label>
          Visualization
          <select
            aria-label="Visualization"
            className={controlClass}
            value={plugin}
            onChange={(e) => setPlugin(e.target.value)}
          >
            <option>Datagrid</option>
            <option>Y Bar</option>
            <option>Y Line</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!ready} onClick={() => void apply()}>
          Apply view
        </Button>
        <Button disabled={!ready} onClick={() => void apply(true)}>
          Reset view
        </Button>
        <Button
          disabled={!ready}
          onClick={() =>
            void viewer.current
              ?.toggleConfig()
              .catch((e) => setError(String(e)))
          }
        >
          Filters, sorting and pivots
        </Button>
      </div>
      <p className="text-sm text-slate-400">
        Use the column controls for filters, sorting, pivots and aggregates.
        Numeric grouping uses Sum by default. Dates use UTC calendar dates.
      </p>
      {error && (
        <p role="alert" className="text-red-300">
          Explorer unavailable: {error}. SQL results remain available below.
        </p>
      )}
      <div
        ref={host}
        className="min-w-0 overflow-hidden rounded-lg border border-slate-700"
      />
      {!ready && !error && <p role="status">{stage}…</p>}
      <details>
        <summary>Accessible record preview (first 20 rows)</summary>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {fields.map((f) => (
                  <th className="p-2" key={f.name}>
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, i) => (
                <tr key={i}>
                  {fields.map((f) => (
                    <td className="max-w-64 truncate p-2" key={f.name}>
                      {String(row[f.name] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
