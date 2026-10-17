import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sessionWindow, saveSession, getWorkingViews } from "../services/sessionService";
import type { WorkingView } from '../types/session';
import type { SessionWindow } from "../types/session";
import { Button } from "./ui/Button";
export function ContinueResearch() {
  const [window, setWindow] = useState<SessionWindow | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [views,setViews]=useState<WorkingView[]>([]);
  async function refresh() {
    try {
      setWindow(await sessionWindow());
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    let active = true;
    getWorkingViews().then(v=>{if(active)setViews(v.slice(0,5));}).catch(e=>{if(active)setError(String(e));});
    sessionWindow()
      .then((w) => {
        if (active) setWindow(w);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="mb-6 space-y-3 rounded-xl border border-slate-700 p-4">
      <h2 className="text-2xl">Continue research</h2>
      {!!views.length&&<div>Saved views: {views.map(v=><Link className="mr-4 text-blue-300" key={v.id} to={`/${v.surface}?${new URLSearchParams(v.filters)}`}>{v.name}</Link>)}</div>}
      {error && <p role="alert">{error}</p>}
      {!window && !error && <p>Loading research checkpoint…</p>}
      {window && (
        <>
          <p>
            {window.first_visit
              ? "First session: existing history is baseline context. Choose Finish session explicitly."
              : `${window.count} research changes since your checkpoint.`}{" "}
            Collection checks alone are not research changes.
          </p>
          <p>
            <Link to="/ingestion">Inbox ({window.pending})</Link> ·{" "}
            <Link to="/ingestion?status=later">Later ({window.later})</Link> ·{" "}
            <Link to="/sources">Collection health and failures</Link>
          </p>
          <Link
            className="text-blue-300"
            to={
              window.current_question
                ? `/research?question=${window.current_question}`
                : "/research"
            }
          >
            Resume question
          </Link>
          <ol className="space-y-2">
            {window.items.map((c) => (
              <li key={c.seq}>
                <Link
                  to={
                    c.question_id
                      ? `/research?question=${c.question_id}`
                      : c.kind === "kept_article"
                        ? `/articles/${c.object_id}`
                        : "/research"
                  }
                >
                  {c.title}
                </Link>{" "}
                —{" "}
                {c.kind === "kept_article"
                  ? "Kept in project (not publication time)"
                  : c.kind}{" "}
                · {new Date(c.recorded_at).toLocaleString()}
              </li>
            ))}
          </ol>
          {!window.items.length && (
            <p>No new research material in this window.</p>
          )}
          {window.has_more && (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const next = await sessionWindow(window.cursor, window.bound);
                  setWindow({
                    ...next,
                    items: [...window.items, ...next.items],
                  });
                } catch (e) {
                  setError(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              More changes (50 at a time)
            </Button>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void refresh()}>
              Refresh changes
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveSession(window.version, window.bound);
                  await refresh();
                } catch (e) {
                  setError(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Finish session / Mark reviewed through captured boundary
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
