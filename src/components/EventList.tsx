import { Link } from "react-router-dom";
import type { FoundationEventWithArticles } from "../types/event";
import { Card } from "./ui/Card";

type Props = {
  events: FoundationEventWithArticles[];
  emptyMessage?: string;
};

export function EventList({
  events,
  emptyMessage = "No events created yet.",
}: Props) {
  return (
    <Card>
      <h2 className="mb-6 text-2xl font-semibold text-white">
        Events
      </h2>

      {events.length === 0 ? (
        <p className="text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block rounded-lg border-b border-slate-800 p-3 transition hover:bg-slate-800/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-white">
                    {event.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {event.description || "No description added."}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {event.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {event.event_type && <span>{event.event_type}</span>}
                {event.location && <span>{event.location}</span>}
                {event.occurred_at && (
                  <span>
                    {new Date(event.occurred_at).toLocaleDateString()}
                  </span>
                )}
                <span>
                  {event.articles.length} linked article
                  {event.articles.length === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
