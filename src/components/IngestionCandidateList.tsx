import type { KeyboardEvent } from "react";
import type {
  IngestionCandidate,
  IngestionImportSource,
  IngestionCandidateStatus,
} from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import { getIngestionCandidatePreview } from "../lib/ingestionCandidatePreview";
import { IngestionCandidateStatusBadge } from "./IngestionCandidateStatusBadge";
import { Card } from "./ui/Card";

const statusTabs: Array<{
  status: IngestionCandidateStatus;
  label: string;
}> = [
  { status: "pending", label: "Pending" },
  { status: "accepted", label: "Accepted" },
  { status: "rejected", label: "Rejected" },
  { status: "duplicate", label: "Duplicate" },
];

const importSourceOptions: Array<{
  value: "all" | IngestionImportSource;
  label: string;
}> = [
  { value: "all", label: "All import sources" },
  { value: "manual_url", label: "Manual URL" },
  { value: "rss", label: "RSS" },
  { value: "browser_extension", label: "Browser Extension" },
  { value: "connector", label: "Connector" },
];

type Props = {
  candidates: IngestionCandidate[];
  sources: Source[];
  selectedStatus: IngestionCandidateStatus;
  statusCounts: Record<IngestionCandidateStatus, number>;
  searchQuery: string;
  selectedSourceFilter: string;
  selectedImportSourceFilter: "all" | IngestionImportSource;
  hasActiveFilters: boolean;
  selectedCandidateId?: string | null;
  onSelectStatus: (status: IngestionCandidateStatus) => void;
  onSearchQueryChange: (value: string) => void;
  onSourceFilterChange: (value: string) => void;
  onImportSourceFilterChange: (value: "all" | IngestionImportSource) => void;
  onClearFilters: () => void;
  onSelectCandidate: (candidate: IngestionCandidate) => void;
};

export function IngestionCandidateList({
  candidates,
  sources,
  selectedStatus,
  statusCounts,
  searchQuery,
  selectedSourceFilter,
  selectedImportSourceFilter,
  hasActiveFilters,
  selectedCandidateId = null,
  onSelectStatus,
  onSearchQueryChange,
  onSourceFilterChange,
  onImportSourceFilterChange,
  onClearFilters,
  onSelectCandidate,
}: Props) {
  function getSourceName(sourceId: string | null): string {
    if (!sourceId) return "No source match";

    return sources.find((source) => source.id === sourceId)?.name ?? "Unknown source";
  }

  function selectCandidateFromKeyboard(
    event: KeyboardEvent<HTMLDivElement>,
    candidate: IngestionCandidate
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelectCandidate(candidate);
  }

  return (
    <Card className="lg:flex lg:max-h-[calc(100vh-8rem)] lg:min-h-0 lg:flex-col">
      <div className="mb-6 lg:flex-none">
        <h2 className="text-2xl font-semibold text-white">
          Review Queue
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const selected = selectedStatus === tab.status;

            return (
              <button
                key={tab.status}
                type="button"
                onClick={() => onSelectStatus(tab.status)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "border-blue-500 bg-blue-500/20 text-blue-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                {tab.label} {statusCounts[tab.status]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 space-y-3 lg:flex-none">
        <input
          type="search"
          placeholder="Search candidates"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={selectedSourceFilter}
            onChange={(event) => onSourceFilterChange(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
            <option value="unknown">Unknown source</option>
          </select>

          <select
            value={selectedImportSourceFilter}
            onChange={(event) =>
              onImportSourceFilterChange(
                event.target.value as "all" | IngestionImportSource
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {importSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm font-medium text-blue-300 transition hover:text-blue-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {candidates.length === 0 ? (
        <p className="text-slate-400">
          {hasActiveFilters
            ? "No candidates match the current filters."
            : `No ${selectedStatus} ingestion candidates.`}
        </p>
      ) : (
        <div className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {candidates.map((candidate) => {
            const selected = candidate.id === selectedCandidateId;
            const preview =
              getIngestionCandidatePreview(candidate) ?? "No preview available";

            return (
              <div
                key={candidate.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCandidate(candidate)}
                onKeyDown={(event) =>
                  selectCandidateFromKeyboard(event, candidate)
                }
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="line-clamp-2 font-medium text-white transition hover:text-blue-200"
                  >
                    {candidate.title || candidate.url}
                  </a>
                  <IngestionCandidateStatusBadge status={candidate.status} />
                </div>

                <p className="break-all text-sm text-blue-300">
                  {candidate.canonical_url ?? candidate.final_url ?? candidate.url}
                </p>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                  {preview}
                </p>

                <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <p>Import: {candidate.import_source.replace("_", " ")}</p>
                  <p>Source: {getSourceName(candidate.source_id)}</p>
                  <p>
                    Created: {new Date(candidate.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    Published:{" "}
                    {candidate.published_at
                      ? new Date(candidate.published_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
