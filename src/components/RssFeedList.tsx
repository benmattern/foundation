import { Card } from "./ui/Card";
import type { RssFeed } from "../types/rssFeed";
import type { Source } from "../types/source";

type Props = {
  feeds: RssFeed[];
  sources: Source[];
  fetchingFeedId: string | null;
  onEditFeed: (feed: RssFeed) => void;
  onFetchFeed: (feed: RssFeed) => Promise<void>;
};

export function RssFeedList({
  feeds,
  sources,
  fetchingFeedId,
  onEditFeed,
  onFetchFeed,
}: Props) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">RSS Feeds</h2>
        <p className="mt-1 text-sm text-slate-400">
          Fetch known feeds manually and stage new items for review.
        </p>
      </div>

      {feeds.length === 0 ? (
        <p className="text-sm text-slate-400">
          No RSS feeds have been added yet.
        </p>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => {
            const source = feed.source_id
              ? sourceById.get(feed.source_id)
              : null;

            return (
              <article
                key={feed.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-semibold text-white">
                        {feed.title || feed.feed_url}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          feed.is_active
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {feed.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 break-all text-sm text-slate-400">
                      {feed.feed_url}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{source ? source.name : "No source selected"}</span>
                      <span>
                        Last checked:{" "}
                        {feed.last_checked_at
                          ? new Date(feed.last_checked_at).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditFeed(feed)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onFetchFeed(feed)}
                      disabled={!feed.is_active || fetchingFeedId === feed.id}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fetchingFeedId === feed.id ? "Fetching..." : "Fetch Feed Now"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
