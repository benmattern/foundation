import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EventArticleTimeline } from "../components/EventArticleTimeline";
import { EventForm } from "../components/EventForm";
import type { EventFormValues } from "../components/EventForm";
import { EventIntelligenceSummary } from "../components/EventIntelligenceSummary";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import type { Article, ArticleWithTags } from "../types/article";
import { getArticles } from "../services/articleService";
import type { FoundationEventWithArticleTags } from "../types/event";
import {
  formatArticleDate,
  formatDate,
  getLastActivityDate,
  getNewestArticle,
  getOldestArticle,
  getRelativeDateLabel,
  getTimelineArticles,
} from "../lib/eventMetrics";
import {
  deleteEvent as deleteEventRecord,
  getEventWithArticleTagsById,
  updateEvent as updateEventRecord,
} from "../services/eventService";

type RelatedTagSummary = {
  id: string;
  name: string;
  count: number;
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<FoundationEventWithArticleTags | null>(
    null
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  async function loadEventDetail() {
    if (!id) return;

    try {
      const [eventData, articleData] = await Promise.all([
        getEventWithArticleTagsById(id),
        getArticles(),
      ]);

      setEvent(eventData);
      setArticles(articleData);
    } catch (error) {
      console.error("Error loading event detail:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEventDetail();
  }, [id]);

  async function updateEvent(values: EventFormValues) {
    if (!id) return;

    try {
      await updateEventRecord(id, values);
      setEditing(false);
      await loadEventDetail();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  }

  async function deleteEvent() {
    if (!event) return;

    const confirmed = window.confirm(
      `Delete "${event.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteEventRecord(event.id);
      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }

  if (loading) {
    return <p className="text-slate-400">Loading event...</p>;
  }

  if (!event) {
    return (
      <>
        <PageHeader
          title="Event Not Found"
          description="The requested event could not be loaded."
        />

        <Link to="/events" className="text-blue-400 hover:text-blue-300">
          Back to Events
        </Link>
      </>
    );
  }

  const newestArticle = getNewestArticle(event.articles);
  const oldestArticle = getOldestArticle(event.articles);
  const timelineArticles = getTimelineArticles(event.articles);
  const relatedTags = getRelatedTags(event.articles);

  return (
    <>
      <div className="mb-6">
        <Link to="/events" className="text-blue-400 hover:text-blue-300">
          ← Back to Events
        </Link>
      </div>

      <PageHeader title={event.title} description="Event detail record" />

      {editing ? (
        <EventForm
          articles={articles}
          mode="edit"
          initialEvent={event}
          onSubmit={updateEvent}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-500"
                >
                  Edit Event
                </button>

                <button
                  type="button"
                  onClick={deleteEvent}
                  className="rounded-xl border border-red-900/50 bg-red-950/30 px-5 py-2 font-medium text-red-300 transition hover:bg-red-900/40"
                >
                  Delete Event
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-white">{event.status}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Type</p>
                  <p className="text-white">
                    {event.event_type || "Unclassified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Occurred</p>
                  <p className="text-white">
                    {event.occurred_at
                      ? new Date(event.occurred_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Location</p>
                  <p className="text-white">
                    {event.location || "No location added."}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400">Description</p>
                <p className="whitespace-pre-wrap text-white">
                  {event.description || "No description added."}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Created</p>
                <p className="text-white">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <EventIntelligenceSummary
            supportingArticleCount={event.articles.length}
            newestArticle={newestArticle}
            oldestArticle={oldestArticle}
            eventAge={getRelativeDateLabel(event.occurred_at)}
            lastActivity={formatDate(
              getLastActivityDate(event, event.articles)
            )}
            relatedTags={relatedTags}
            formatArticleDate={formatArticleDate}
          />

          <EventArticleTimeline
            articles={timelineArticles}
            formatArticleDate={formatArticleDate}
          />
        </div>
      )}
    </>
  );
}

function getRelatedTags(articles: ArticleWithTags[]): RelatedTagSummary[] {
  const tagsById = new Map<string, RelatedTagSummary>();

  articles.forEach((article) => {
    article.tags.forEach((tag) => {
      const current = tagsById.get(tag.id);

      if (current) {
        current.count += 1;
        return;
      }

      tagsById.set(tag.id, {
        id: tag.id,
        name: tag.name,
        count: 1,
      });
    });
  });

  return [...tagsById.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}
