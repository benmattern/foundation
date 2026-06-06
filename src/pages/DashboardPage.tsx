import { useEffect, useState } from "react";
import { DashboardEventHighlights } from "../components/DashboardEventHighlights";
import { DashboardMetricCards } from "../components/DashboardMetricCards";
import { DashboardRecentArticles } from "../components/DashboardRecentArticles";
import { DashboardTopTags } from "../components/DashboardTopTags";
import { EventStatusOverview } from "../components/EventStatusOverview";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import {
  getDashboardMetrics,
  getMostActiveEvents,
  getRecentArticles,
  getRecentlyUpdatedEvents,
  getTopTags,
  toEventListItems,
} from "../lib/dashboardMetrics";
import { getArticlesWithTags } from "../services/articleService";
import { getEventsWithArticles } from "../services/eventService";
import { getSources } from "../services/sourceService";
import { getTags } from "../services/tagService";
import type { ArticleWithTags } from "../types/article";
import type { FoundationEventWithArticles } from "../types/event";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";

export default function DashboardPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<FoundationEventWithArticles[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [sourceData, articleData, tagData, eventData] =
          await Promise.all([
            getSources(),
            getArticlesWithTags(),
            getTags(),
            getEventsWithArticles(),
          ]);

        setSources(sourceData);
        setArticles(articleData);
        setTags(tagData);
        setEvents(eventData);
        setErrorMessage("");
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setErrorMessage("Unable to load dashboard intelligence data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const eventListItems = toEventListItems(events);
  const dashboardMetrics = getDashboardMetrics({
    sourceCount: sources.length,
    articleCount: articles.length,
    events,
  });
  const mostActiveEvents = getMostActiveEvents(eventListItems);
  const recentlyUpdatedEvents = getRecentlyUpdatedEvents(eventListItems);
  const topTags = getTopTags(articles);
  const recentArticles = getRecentArticles(articles);
  const hasAnyDashboardData =
    sources.length + articles.length + tags.length + events.length > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Analyst overview of active events, supporting articles, source coverage, and topic concentration."
      />

      {loading ? (
        <Card>
          <p className="text-slate-400">Loading dashboard intelligence...</p>
        </Card>
      ) : errorMessage ? (
        <Card>
          <p className="font-medium text-red-300">{errorMessage}</p>
          <p className="mt-2 text-sm text-slate-400">
            Check the Supabase connection and try refreshing the page.
          </p>
        </Card>
      ) : !hasAnyDashboardData ? (
        <Card>
          <h2 className="text-xl font-semibold text-white">
            No intelligence records yet
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Add sources, articles, tags, and events to populate the analyst
            dashboard.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <DashboardMetricCards metrics={dashboardMetrics} />

          <EventStatusOverview events={events} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardEventHighlights
              title="Most Active Events"
              events={mostActiveEvents}
              emptyMessage="No events have supporting articles yet."
            />
            <DashboardEventHighlights
              title="Recently Updated Events"
              events={recentlyUpdatedEvents}
              emptyMessage="No event activity is available yet."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardTopTags tags={topTags} />
            <DashboardRecentArticles articles={recentArticles} />
          </div>
        </div>
      )}
    </>
  );
}
