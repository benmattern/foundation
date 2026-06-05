import type { EventStatus } from "../types/event";
import { eventStatusOptions, eventTypeOptions } from "../types/event";
import { Card } from "./ui/Card";

type Props = {
  searchQuery: string;
  selectedStatus: "" | EventStatus;
  selectedEventType: string;
  resultCount: number;
  totalCount: number;
  onSearchQueryChange: (value: string) => void;
  onSelectedStatusChange: (value: "" | EventStatus) => void;
  onSelectedEventTypeChange: (value: string) => void;
  onClearFilters: () => void;
};

export function EventFilters({
  searchQuery,
  selectedStatus,
  selectedEventType,
  resultCount,
  totalCount,
  onSearchQueryChange,
  onSelectedStatusChange,
  onSelectedEventTypeChange,
  onClearFilters,
}: Props) {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "" ||
    selectedEventType !== "";

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Filter Events
            </h2>
            <p className="text-sm text-slate-400">
              Showing {resultCount} of {totalCount} events.
            </p>
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search title or description"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />

          <select
            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedStatus ? "text-white" : "text-slate-500"
            }`}
            value={selectedStatus}
            onChange={(event) =>
              onSelectedStatusChange(event.target.value as "" | EventStatus)
            }
          >
            <option value="">All statuses</option>
            {eventStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedEventType ? "text-white" : "text-slate-500"
            }`}
            value={selectedEventType}
            onChange={(event) => onSelectedEventTypeChange(event.target.value)}
          >
            <option value="">All event types</option>
            {eventTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
