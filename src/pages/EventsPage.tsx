import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { EventForm } from "../components/EventForm";
import type { EventFormValues } from "../components/EventForm";
import { EventList } from "../components/EventList";
import type { Article } from "../types/article";
import { getArticles } from "../services/articleService";
import type { FoundationEventWithArticles } from "../types/event";
import {
  createEvent as createEventRecord,
  getEventsWithArticles,
} from "../services/eventService";

export default function EventsPage() {
  const [events, setEvents] = useState<FoundationEventWithArticles[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEventsPageData() {
    try {
      const [eventData, articleData] = await Promise.all([
        getEventsWithArticles(),
        getArticles(),
      ]);

      setEvents(eventData);
      setArticles(articleData);
    } catch (error) {
      console.error("Error loading events page data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEventsPageData();
  }, []);

  async function createEvent(event: EventFormValues) {
    try {
      await createEventRecord(event);
      await loadEventsPageData();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Events"
        description="Create and manage analyst-defined developments linked to source articles."
      />

      {loading ? (
        <p className="text-slate-400">Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <EventForm articles={articles} onSubmit={createEvent} />
          <EventList events={events} />
        </div>
      )}
    </>
  );
}
