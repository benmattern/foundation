import type { EventStatus, FoundationEventWithArticles } from "../types/event";
import { eventStatusOptions } from "../types/event";
import { Card } from "./ui/Card";

type Props = {
  events: FoundationEventWithArticles[];
};

const statusLabels: Record<EventStatus, string> = {
  draft: "Draft",
  active: "Active",
  resolved: "Resolved",
  archived: "Archived",
};

export function EventStatusOverview({ events }: Props) {
  const counts = eventStatusOptions.reduce<Record<EventStatus, number>>(
    (map, status) => {
      map[status] = events.filter((event) => event.status === status).length;
      return map;
    },
    {
      draft: 0,
      active: 0,
      resolved: 0,
      archived: 0,
    }
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {eventStatusOptions.map((status) => (
        <Card key={status}>
          <p className="text-sm font-medium text-slate-400">
            {statusLabels[status]}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {counts[status]}
          </p>
        </Card>
      ))}
    </div>
  );
}
