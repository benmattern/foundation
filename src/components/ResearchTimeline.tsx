import { Link } from "react-router-dom";
import type { TimelineEvent } from "../types/timeline";
import { eventDateLabel, eventGroup } from "../lib/timeline";
export function ResearchTimeline({
  events,
  returnTo,
}: {
  events: TimelineEvent[];
  returnTo: string;
}) {
  return (
    <section aria-label="Chronological events" className="space-y-4">
      {events.map((event, index) => {
        const { year, month } = eventGroup(event);
        const previous = index ? eventGroup(events[index - 1]) : null;
        const yearChanged = year !== previous?.year,
          monthChanged = yearChanged || month !== previous?.month;
        return (
          <div key={event.id}>
            {yearChanged && (
              <h2 className="mb-3 text-2xl font-semibold">{year}</h2>
            )}
            {monthChanged && month && (
              <h3 className="mb-3 text-lg text-blue-200">
                {month} {year}
              </h3>
            )}
            <article className="relative ml-2 border-l-2 border-blue-800 py-2 pl-5 sm:pl-8">
              <span
                aria-hidden="true"
                className="absolute top-5 -left-1.5 h-2.5 w-2.5 rounded-full bg-blue-400"
              />
              <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <p className="break-words text-sm text-blue-200">
                  {eventDateLabel(event)}
                </p>
                <h4 className="break-words text-xl font-semibold">
                  <Link
                    className="text-blue-300 underline decoration-blue-800"
                    to={`/events/${event.id}?returnTo=${encodeURIComponent(returnTo)}`}
                  >
                    {event.title}
                  </Link>
                </h4>
                <p className="text-sm text-slate-400">
                  {event.event_type || "Unclassified"} · {event.status} ·{" "}
                  {event.claim_kind.replaceAll("_", " ")}
                </p>
                <p className="line-clamp-3 break-words whitespace-pre-wrap text-slate-300">
                  {event.description || "No event account added."}
                </p>
                <p className="text-sm text-slate-400">
                  {event.evidence_count ?? 0} article references ·{" "}
                  {event.entity_count ?? 0} explicit entities ·{" "}
                  {event.question_count ?? 0} research questions
                </p>
                {event.date_note && (
                  <p className="line-clamp-2 break-words text-sm text-amber-200">
                    Date basis: {event.date_note}
                  </p>
                )}
              </div>
            </article>
          </div>
        );
      })}
    </section>
  );
}
