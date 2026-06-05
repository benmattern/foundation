import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { EventForm } from "../components/EventForm";
import type { EventFormValues } from "../components/EventForm";
import { EventFilters } from "../components/EventFilters";
import { EventList } from "../components/EventList";
import type { Article } from "../types/article";
import { getArticles } from "../services/articleService";
import type {
  EventStatus,
  FoundationEventWithArticles,
} from "../types/event";
import {
  createEvent as createEventRecord,
  getEventsWithArticles,
} from "../services/eventService";

export default function EventsPage() {
  const [events, setEvents] = useState<FoundationEventWithArticles[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | EventStatus>("");
  const [selectedEventType, setSelectedEventType] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      normalizedSearchQuery === "" ||
      event.title.toLowerCase().includes(normalizedSearchQuery) ||
      (event.description ?? "").toLowerCase().includes(normalizedSearchQuery);

    const matchesStatus =
      selectedStatus === "" || event.status === selectedStatus;

    const matchesEventType =
      selectedEventType === "" || event.event_type === selectedEventType;

    return matchesSearch && matchesStatus && matchesEventType;
  });

  function clearFilters() {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedEventType("");
  }

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
        <div className="space-y-6">
          <EventFilters
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedEventType={selectedEventType}
            resultCount={filteredEvents.length}
            totalCount={events.length}
            onSearchQueryChange={setSearchQuery}
            onSelectedStatusChange={setSelectedStatus}
            onSelectedEventTypeChange={setSelectedEventType}
            onClearFilters={clearFilters}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <EventForm articles={articles} onSubmit={createEvent} />
            <EventList
              events={filteredEvents}
              emptyMessage="No events match the current filters."
            />
          </div>
        </div>
      )}
    </>
  );
}
