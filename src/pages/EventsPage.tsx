import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { EventForm } from "../components/EventForm";
import type { EventFormValues } from "../components/EventForm";
import { EventFilters } from "../components/EventFilters";
import { EventList } from "../components/EventList";
import { EventStatusOverview } from "../components/EventStatusOverview";
import type { Article } from "../types/article";
import { getArticles } from "../services/articleService";
import type {
  EventListItem,
  EventSortOption,
  EventStatus,
  FoundationEventWithArticles,
} from "../types/event";
import {
  getEventDate,
  getLastActivityDate,
} from "../lib/eventMetrics";
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
  const [selectedSort, setSelectedSort] =
    useState<EventSortOption>("newest_activity");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const eventListItems = events.map<EventListItem>((event) => ({
    ...event,
    supportingArticleCount: event.articles.length,
    lastActivityAt: getLastActivityDate(event, event.articles),
  }));

  const filteredEvents = eventListItems.filter((event) => {
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
  const sortedEvents = sortEvents(filteredEvents, selectedSort);

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
          <EventStatusOverview events={events} />

          <EventFilters
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedEventType={selectedEventType}
            selectedSort={selectedSort}
            resultCount={sortedEvents.length}
            totalCount={events.length}
            onSearchQueryChange={setSearchQuery}
            onSelectedStatusChange={setSelectedStatus}
            onSelectedEventTypeChange={setSelectedEventType}
            onSelectedSortChange={setSelectedSort}
            onClearFilters={clearFilters}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <EventForm articles={articles} onSubmit={createEvent} />
            <EventList
              events={sortedEvents}
              emptyMessage="No events match the current filters."
            />
          </div>
        </div>
      )}
    </>
  );
}

function sortEvents(
  events: EventListItem[],
  sortOption: EventSortOption
): EventListItem[] {
  return [...events].sort((a, b) => {
    if (sortOption === "most_supporting_articles") {
      return (
        b.supportingArticleCount - a.supportingArticleCount ||
        compareDatesDescending(getEventDate(a), getEventDate(b))
      );
    }

    if (sortOption === "oldest_event") {
      return compareDatesAscending(getEventDate(a), getEventDate(b));
    }

    if (sortOption === "newest_event") {
      return compareDatesDescending(getEventDate(a), getEventDate(b));
    }

    return compareDatesDescending(a.lastActivityAt, b.lastActivityAt);
  });
}

function compareDatesDescending(a: Date | null, b: Date | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return b.getTime() - a.getTime();
}

function compareDatesAscending(a: Date | null, b: Date | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return a.getTime() - b.getTime();
}
