import { useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchRssFeed,
  updateRssFeed,
  type CollectionRun,
} from "../services/rssFeedService";
import { saveSubscription } from "../services/projectService";
import { feedHealth, collectionError } from "../lib/projectWorkflow";
import type { RssFeed } from "../types/rssFeed";
import type { Source } from "../types/source";
import type { Subscription } from "../types/project";
import { Button } from "./ui/Button";
import { buttonClass } from "./ui/buttonStyles";
import { Input } from "./ui/Input";

export function SourceFeedCard({
  feed,
  source,
  subscription,
  runs,
  archived,
  onChange,
}: {
  feed: RssFeed;
  source?: Source;
  subscription?: Subscription;
  runs: CollectionRun[];
  archived: boolean;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rawError, setRawError] = useState("");
  const [message, setMessage] = useState("");
  const [feedUrl, setFeedUrl] = useState(feed.feed_url);
  const health = feedHealth(feed, runs);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setRawError("");
    setMessage("");
    try {
      await action();
      await onChange().catch(() => {
        setError(
          "The request finished, but source health could not refresh. Use Refresh source health to check the saved state.",
        );
      });
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      setRawError(raw);
      setError(collectionError(raw));
      await onChange().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  const sourcePath = source ? `/sources/${source.id}` : "/sources?view=saved";
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="text-lg font-semibold">
        {feed.title || source?.name || "Collection feed"}
      </h3>
      <p className="text-sm text-slate-300">
        {subscription?.enabled
          ? "Following in this project"
          : "Paused in this project"}
        {archived ? " · Project archived" : ""} · {health.label}
      </p>
      <p className="text-sm text-slate-400">{health.detail}</p>
      <p className="text-sm text-slate-400">
        Last successful check:{" "}
        {feed.last_success_at
          ? new Date(feed.last_success_at).toLocaleString()
          : "Never"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          disabled={
            !subscription?.enabled ||
            !feed.is_active ||
            archived ||
            health.kind === "running"
          }
          busy={busy}
          onClick={() =>
            void run(async () => {
              const result = await fetchRssFeed(feed);
              if (result.errors.length)
                throw new Error(result.errors.join("; "));
              setMessage(
                result.warnings.length > 1
                  ? "Check completed with notices. Open the inbox to review this project's available items; collection details contain notices."
                  : "Check completed. Open the inbox to review this project's available items.",
              );
            })
          }
        >
          Check now
        </Button>
        <Button
          disabled={archived || busy || subscription?.followed === false}
          onClick={() =>
            void run(async () => {
              await saveSubscription(
                feed.id,
                !subscription?.enabled,
                subscription?.rules ?? null,
                subscription?.rules ?? null,
              );
            })
          }
        >
          {subscription?.enabled ? "Pause feed" : "Resume feed"}
        </Button>
      </div>
      {busy && (
        <p role="status">
          Request in progress. Results will appear when the check finishes.
        </p>
      )}
      {error && (
        <p role="alert" className="text-amber-200">
          {error}
        </p>
      )}
      {message && (
        <div role="status" className="space-y-3">
          <p>{message}</p>
          <Link
            className={buttonClass()}
            to="/ingestion?status=pending&route=pending"
          >
            Open inbox
          </Link>
        </div>
      )}
      <Link className={buttonClass()} to={sourcePath}>
        Adjust source rules and collection
      </Link>
      <details>
        <summary>Collection details and advanced management</summary>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-400">
            Feed health and run totals below describe this feed across your
            workspace, not this project's new-item count.
          </p>
          <p className="text-sm">
            Last attempted:{" "}
            {feed.last_checked_at
              ? new Date(feed.last_checked_at).toLocaleString()
              : "Never"}
          </p>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await updateRssFeed(feed.id, {
                  feed_url: feedUrl,
                  source_id: feed.source_id,
                  title: feed.title ?? "",
                  is_active: feed.is_active,
                });
                setMessage("Feed address saved.");
              });
            }}
          >
            <Input
              label="RSS/Atom feed address"
              type="url"
              required
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              hint="Editing this shared feed changes its address for all your projects."
            />
            <Button type="submit" disabled={busy}>
              Save feed address
            </Button>
          </form>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              disabled={busy}
              checked={feed.is_active}
              onChange={(e) => {
                const enabled = e.target.checked;
                void run(async () => {
                  await updateRssFeed(feed.id, {
                    feed_url: feed.feed_url,
                    source_id: feed.source_id,
                    title: feed.title ?? "",
                    is_active: enabled,
                  });
                });
              }}
            />
            Available for collection across all your projects
          </label>
          {rawError && (
            <p className="break-words text-sm text-amber-300">
              Details: {rawError}
            </p>
          )}
          <h4 className="font-semibold">Recent feed checks</h4>
          {runs.filter((r) => r.feed_id === feed.id).length === 0 && (
            <p>No checks recorded yet.</p>
          )}
          <ul className="space-y-3 text-sm text-slate-400">
            {runs
              .filter((r) => r.feed_id === feed.id)
              .map((r) => (
                <li key={r.id}>
                  {new Date(r.started_at).toLocaleString()} · {r.status} ·{" "}
                  {r.fetched} items processed · {r.staged} staged across
                  following projects. {r.error} {r.warnings.join("; ")}
                </li>
              ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
