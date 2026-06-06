import { Link } from "react-router-dom";
import { formatDate, getEventDate } from "../lib/eventMetrics";
import type { EventListItem } from "../types/event";
import { Card } from "./ui/Card";

type Props = {
  title: string;
  events: EventListItem[];
  emptyMessage: string;
};

export function DashboardEventHighlights({
  title,
  events,
  emptyMessage,
}: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">{title}</h2>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block rounded-lg border border-slate-800 p-4 transition hover:bg-slate-800/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {event.description || "No description added."}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {event.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-3">
                <span>Articles: {event.supportingArticleCount}</span>
                <span>Activity: {formatDate(event.lastActivityAt)}</span>
                <span>Occurred: {formatDate(getEventDate(event))}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
