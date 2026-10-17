import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getWorkingViews, saveWorkingView } from "../services/sessionService";
import type { WorkingView } from "../types/session";
import { viewFilters } from "../lib/workingViews";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
export function WorkingViews({
  surface,
}: {
  surface: "articles" | "ingestion";
}) {
  const [params, setParams] = useSearchParams(),
    [views, setViews] = useState<WorkingView[]>([]),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function read() {
    setViews(await getWorkingViews());
  }
  useEffect(() => {
    let active = true;
    getWorkingViews()
      .then((v) => {
        if (active) setViews(v);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(view: WorkingView, remove = false) {
    setBusy(true);
    try {
      await saveWorkingView(view, remove);
      await read();
      setName("");
      setError("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mb-4 rounded-xl border border-slate-700 p-4">
      <summary>Saved working views</summary>
      <p>
        Browsing filters only. Saving a view never changes intake rules or
        review decisions.
      </p>
      <Input
        label="View name"
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        disabled={busy || !name.trim()}
        onClick={() =>
          void save({
            id: crypto.randomUUID(),
            name,
            surface,
            filters: viewFilters(params),
            version: 0,
          })
        }
      >
        Save current filters
      </Button>
      <label className="block">
        Date mode
        <select
          value={params.get("period") ?? ""}
          onChange={(e) => {
            const p = new URLSearchParams(params);
            if (e.target.value) {
              p.set("period", e.target.value);
              p.delete("since");
              p.delete("until");
            } else p.delete("period");
            p.delete("page");
            setParams(p);
          }}
        >
          <option value="">Fixed dates / no relative period</option>
          <option value="7">Rolling 7 days</option>
          <option value="30">Rolling 30 days</option>
        </select>
      </label>
      <ul>
        {views
          .filter((v) => v.surface === surface)
          .map((v) => (
            <li className="flex flex-wrap items-center gap-3 py-2" key={v.id}>
              <Link to={`/${surface}?${new URLSearchParams(v.filters)}`}>
                {v.name}
              </Link>
              <Button
                disabled={busy}
                onClick={() =>
                  void save({
                    ...v,
                    name: name.trim() || v.name,
                    filters: viewFilters(params),
                  })
                }
              >
                Replace with current filters
              </Button>
              <Button disabled={busy} onClick={() => void save(v, true)}>
                Delete view
              </Button>
            </li>
          ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
