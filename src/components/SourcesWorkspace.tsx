import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getSources } from "../services/sourceService";
import { getRssFeeds, getCollectionRuns } from "../services/rssFeedService";
import {
  activeProjectId,
  getProjects,
  getSubscriptions,
  setSourceState,
  getSourceStates,
  type ProjectSourceState,
} from "../services/projectService";
import type { Source } from "../types/source";
import type { RssFeed } from "../types/rssFeed";
import type { Subscription } from "../types/project";
import type { CollectionRun } from "../services/rssFeedService";
import { feedHealth } from "../lib/projectWorkflow";
import { SourceSetupForm } from "./SourceSetupForm";
import { SourceFeedCard } from "./SourceFeedCard";
import { SourceCatalog } from "./SourceCatalog";
import { SourceCoverage } from "./SourceCoverage";
import { Subscriptions } from "./Subscriptions";
import { PageHeader } from "./PageHeader";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { buttonClass } from "./ui/buttonStyles";
import { EmptyState } from "./ui/EmptyState";

type Data = {
  states: ProjectSourceState[];
  sources: Source[];
  feeds: RssFeed[];
  subscriptions: Subscription[];
  runs: CollectionRun[];
  archived: boolean;
};
export function SourcesWorkspace() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const requestedView = params.get("view") ?? "following";
  const view = ["collection", "available"].includes(requestedView)
    ? "saved"
    : requestedView;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [savedSourceId, setSavedSourceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<Source | "new" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  async function read(): Promise<Data> {
    const project = activeProjectId();
    const [sources, feeds, subscriptions, runs, projects, states] =
      await Promise.all([
        getSources(),
        getRssFeeds(),
        getSubscriptions(),
        getCollectionRuns(),
        getProjects(),
        getSourceStates(),
      ]);
    return {
      sources,
      states,
      feeds,
      subscriptions,
      runs,
      archived: projects.find((p) => p.id === project)?.archived ?? true,
    };
  }
  async function refresh() {
    setData(await read());
  }
  useEffect(() => {
    let active = true;
    read()
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
        }
      })
      .catch((error: unknown) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const source = data?.sources.find((s) => s.id === id);
  const followingIds = new Set(
    data?.subscriptions
      .filter((s) => s.followed !== false)
      .map((s) => data.feeds.find((f) => f.id === s.feed_id)?.source_id)
      .filter(Boolean),
  );
  for (const state of data?.states ?? []) {
    if (state.state === "unfollowed") followingIds.delete(state.source_id);
    else followingIds.add(state.source_id);
  }
  const shown =
    data?.sources.filter((s) =>
      id ? s.id === id : view === "following" ? followingIds.has(s.id) : true,
    ) ?? [];
  return (
    <>
      {id && (
        <Link to="/sources" className="mb-4 inline-block text-blue-300">
          Back to Sources
        </Link>
      )}
      <PageHeader
        title={id ? (source?.name ?? "Source details") : "Sources"}
        description="Choose where this project collects research. Incoming items go to Inbox for your review."
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {!id && (
          <nav aria-label="Source views" className="flex flex-wrap gap-2">
            {[
              ["following", "Following"],
              ["discover", "Discover"],
              ["saved", "Your saved sources"],
              ["coverage", "Coverage and calibration"],
            ].map(([value, label]) => (
              <Button
                key={value}
                aria-pressed={view === value}
                variant={view === value ? "primary" : "secondary"}
                onClick={() => setParams({ view: value })}
              >
                {label}
              </Button>
            ))}
          </nav>
        )}
        <Button className="sm:ml-auto" onClick={() => setForm("new")}>
          Add source
        </Button>
      </div>
      {form && (
        <Dialog
          busy={formBusy}
          title={form === "new" ? "Add source" : "Configure source"}
          onClose={() => setForm(null)}
        >
          <SourceSetupForm
            onBusyChange={setFormBusy}
            source={form === "new" ? undefined : form}
            onCancel={() => {
              setForm(null);
              void refresh().catch((error: unknown) => setError(String(error)));
            }}
            onDone={(record, automatic) => {
              setForm(null);
              setSavedSourceId(record.id);
              setMessage(
                automatic
                  ? `${record.name} is now followed in this project. Use Check now to collect incoming items.`
                  : `${record.name} saved. Open source details to configure or enable collection, or capture links manually.`,
              );
              void refresh().catch((error: unknown) => setError(String(error)));
            }}
          />
        </Dialog>
      )}
      {error && (
        <EmptyState
          title="Sources could not be refreshed"
          action={
            <Button onClick={() => setRevision((n) => n + 1)}>
              Retry sources
            </Button>
          }
        >
          {error}
        </EmptyState>
      )}
      {message && (
        <div
          role="status"
          className="mb-5 space-y-3 rounded-xl border border-blue-800 bg-blue-950/30 p-4"
        >
          <p>{message}</p>
          {savedSourceId && (
            <Link to={`/sources/${savedSourceId}`} className={buttonClass()}>
              View source details
            </Link>
          )}
          <Link to="/articles?capture=1" className={buttonClass()}>
            Capture a link
          </Link>
        </div>
      )}
      {!data ? (
        <p role="status">Loading sources…</p>
      ) : id && !source ? (
        <EmptyState
          title="Source not available"
          action={
            <Link className={buttonClass()} to="/sources">
              Back to sources
            </Link>
          }
        >
          This source could not be found in your workspace.
        </EmptyState>
      ) : view === "coverage" && !id ? (
        <SourceCoverage
          runs={data.runs}
          sources={data.sources}
          feeds={data.feeds}
          subscriptions={data.subscriptions}
          states={data.states}
        />
      ) : view === "discover" && !id ? (
        <SourceCatalog
          feeds={data.feeds}
          subscriptions={data.subscriptions}
          archived={data.archived}
          onAdd={() => setForm("new")}
          onEnabled={refresh}
        />
      ) : (
        <div className="space-y-6">
          {view === "saved" && !id && (
            <p className="text-slate-400">
              These source records are available across your workspace. A record
              is only collecting for this project when you follow an available
              feed.
            </p>
          )}
          {view === "saved" && !id && (
            <p className="text-slate-400">
              Feed addresses, availability, project rules and run history live
              here. Following controls affect only this project; shared
              availability is labeled separately.
            </p>
          )}
          {shown.length === 0 &&
            !data.feeds.some(
              (f) =>
                !f.source_id &&
                (view !== "following" ||
                  data.subscriptions.some((s) => s.feed_id === f.id)),
            ) && (
              <EmptyState
                title="No sources followed yet"
                action={
                  <>
                    <Link
                      className={buttonClass("primary")}
                      to="/sources?view=discover"
                    >
                      Discover sources
                    </Link>
                    <Button onClick={() => setForm("new")}>Add source</Button>
                    <Link
                      className={buttonClass()}
                      to="/sources?view=available"
                    >
                      Browse available sources
                    </Link>
                  </>
                }
              >
                Enable a source with a feed for incoming items, or save a
                manual-only source and capture links yourself.
              </EmptyState>
            )}
          {shown.map((source) => {
            const feeds = data.feeds.filter((f) => f.source_id === source.id);
            const followed = feeds.filter((f) =>
              data.subscriptions.some(
                (s) => s.feed_id === f.id && s.enabled && s.followed !== false,
              ),
            );
            const sourceState = data.states.find(
              (s) => s.source_id === source.id,
            );
            const isFollowed =
              sourceState?.state !== "unfollowed" &&
              followingIds.has(source.id);
            const isPaused =
              isFollowed &&
              (feeds.length
                ? followed.length === 0
                : sourceState?.state === "paused");
            const enabled = followed.filter((f) => f.is_active);
            return (
              <article
                key={source.id}
                className="min-w-0 space-y-4 rounded-2xl border border-slate-700 bg-slate-900/40 p-4 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">
                      <Link
                        to={`/sources/${source.id}`}
                        className="text-blue-200 hover:underline"
                      >
                        {source.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {feeds.length
                        ? `${enabled.length} enabled of ${feeds.length} feeds - ${!isFollowed ? "Not followed in this project" : isPaused ? "Paused in this project" : "Following in this project"}`
                        : "Manual only · Automatic collection not configured"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(feeds.length > 0 || !isFollowed || isPaused) && (
                      <Button
                        disabled={data.archived || busy !== null}
                        onClick={async () => {
                          setBusy(source.id);
                          setError("");
                          try {
                            await setSourceState(
                              source.id,
                              isFollowed && !isPaused ? "paused" : "following",
                              sourceState?.version ?? 0,
                            );
                            await refresh();
                          } catch (error) {
                            setError(String(error));
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        {isPaused
                          ? "Resume source"
                          : isFollowed
                            ? "Pause source"
                            : "Follow source"}
                      </Button>
                    )}
                    {isFollowed && (
                      <Button
                        disabled={data.archived || busy !== null}
                        onClick={async () => {
                          setBusy(source.id);
                          try {
                            await setSourceState(
                              source.id,
                              "unfollowed",
                              sourceState?.version ?? 0,
                            );
                            await refresh();
                          } catch (e) {
                            setError(String(e));
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        Unfollow source
                      </Button>
                    )}
                    <Button onClick={() => setForm(source)}>
                      {feeds.length
                        ? "Edit source / add feed"
                        : "Configure collection"}
                    </Button>
                  </div>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-blue-300"
                >
                  Open original source
                </a>
                {source.notes && id && (
                  <p className="whitespace-pre-wrap text-slate-400">
                    {source.notes}
                  </p>
                )}
                {feeds.length === 0 ? (
                  <Link className={buttonClass()} to="/articles?capture=1">
                    Capture a link
                  </Link>
                ) : (
                  <>
                    {feeds.map((feed) => (
                      <SourceFeedCard
                        key={feed.id}
                        feed={feed}
                        source={source}
                        subscription={data.subscriptions.find(
                          (s) => s.feed_id === feed.id,
                        )}
                        runs={data.runs}
                        archived={data.archived}
                        onChange={refresh}
                      />
                    ))}
                    <details>
                      <summary>Matching rules for this source</summary>
                      <Subscriptions
                        feeds={feeds}
                        revision={data.subscriptions}
                        onChanged={refresh}
                      />
                    </details>
                  </>
                )}
              </article>
            );
          })}
          {view === "saved" &&
            !id &&
            data.feeds
              .filter((f) => !f.source_id)
              .map((feed) => (
                <SourceFeedCard
                  key={feed.id}
                  feed={feed}
                  subscription={data.subscriptions.find(
                    (s) => s.feed_id === feed.id,
                  )}
                  runs={data.runs}
                  archived={data.archived}
                  onChange={refresh}
                />
              ))}
          {view === "following" &&
            !id &&
            data.feeds
              .filter(
                (f) =>
                  !f.source_id &&
                  data.subscriptions.some(
                    (s) => s.feed_id === f.id && s.followed !== false,
                  ),
              )
              .map((feed) => (
                <SourceFeedCard
                  key={feed.id}
                  feed={feed}
                  subscription={data.subscriptions.find(
                    (s) => s.feed_id === feed.id,
                  )}
                  runs={data.runs}
                  archived={data.archived}
                  onChange={refresh}
                />
              ))}
          {data.archived && (
            <p className="text-amber-200">
              This project is archived. Reopen it in Project settings to resume
              following and collection.
            </p>
          )}
          <p className="text-sm text-slate-400">
            Health is based on recent checks of the shared feed.{" "}
            {data.feeds.some((f) => feedHealth(f, data.runs).kind === "running")
              ? "Some feeds are collecting."
              : "Automatic collection continues while your browser is closed."}
          </p>
          <Button onClick={() => setRevision((n) => n + 1)}>
            Refresh source health
          </Button>
        </div>
      )}
    </>
  );
}
