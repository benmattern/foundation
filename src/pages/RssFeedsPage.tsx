import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { RssFeedForm } from "../components/RssFeedForm";
import { RssFeedList } from "../components/RssFeedList";
import { RssFetchSummary } from "../components/RssFetchSummary";
import { getSources } from "../services/sourceService";
import {
  createRssFeed,
  fetchRssFeed,
  getRssFeeds,
  updateRssFeed,
  type UpsertRssFeedInput,
} from "../services/rssFeedService";
import type { RssFeed, RssFetchSummary as RssFetchSummaryType } from "../types/rssFeed";
import type { Source } from "../types/source";

export default function RssFeedsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [feedToEdit, setFeedToEdit] = useState<RssFeed | null>(null);
  const [latestSummary, setLatestSummary] =
    useState<RssFetchSummaryType | null>(null);
  const [fetchingFeedId, setFetchingFeedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPageData() {
    try {
      const [feedData, sourceData] = await Promise.all([
        getRssFeeds(),
        getSources(),
      ]);

      setFeeds(feedData);
      setSources(sourceData);

      if (feedToEdit) {
        setFeedToEdit(
          feedData.find((feed) => feed.id === feedToEdit.id) ?? null
        );
      }
    } catch (error) {
      console.error("Error loading RSS feeds:", error);
      setErrorMessage("Unable to load RSS feeds.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  async function saveFeed(feed: UpsertRssFeedInput) {
    setErrorMessage("");

    try {
      if (feedToEdit) {
        await updateRssFeed(feedToEdit.id, feed);
        setFeedToEdit(null);
      } else {
        await createRssFeed(feed);
      }

      await loadPageData();
    } catch (error) {
      console.error("Error saving RSS feed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save RSS feed."
      );
    }
  }

  async function fetchFeed(feed: RssFeed) {
    setErrorMessage("");
    setFetchingFeedId(feed.id);

    try {
      const summary = await fetchRssFeed(feed);
      setLatestSummary(summary);
      await loadPageData();
    } catch (error) {
      console.error("Error fetching RSS feed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fetch RSS feed."
      );
    } finally {
      setFetchingFeedId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="RSS"
        description="Manage RSS feeds and send new feed items to the Review Queue."
      />

      {loading ? (
        <p className="text-slate-400">Loading RSS feeds...</p>
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
            <RssFeedForm
              feedToEdit={feedToEdit}
              sources={sources}
              onSubmit={saveFeed}
              onCancelEdit={() => setFeedToEdit(null)}
            />

            <div className="space-y-6">
              <RssFeedList
                feeds={feeds}
                sources={sources}
                fetchingFeedId={fetchingFeedId}
                onEditFeed={setFeedToEdit}
                onFetchFeed={fetchFeed}
              />

              <RssFetchSummary summary={latestSummary} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
