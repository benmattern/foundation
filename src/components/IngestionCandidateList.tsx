import type {
  IngestionCandidate,
  IngestionCandidateStatus,
} from "../types/ingestionCandidate";
import type { Source } from "../types/source";
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

type Props = {
  candidates: IngestionCandidate[];
  sources: Source[];
  selectedStatus: IngestionCandidateStatus;
  statusCounts: Record<IngestionCandidateStatus, number>;
  selectedCandidateId?: string | null;
  onSelectStatus: (status: IngestionCandidateStatus) => void;
  onSelectCandidate: (candidate: IngestionCandidate) => void;
};

export function IngestionCandidateList({
  candidates,
  sources,
  selectedStatus,
  statusCounts,
  selectedCandidateId = null,
  onSelectStatus,
  onSelectCandidate,
}: Props) {
  function getSourceName(sourceId: string | null): string {
    if (!sourceId) return "No source match";

    return sources.find((source) => source.id === sourceId)?.name ?? "Unknown source";
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

      {candidates.length === 0 ? (
        <p className="text-slate-400">
          No {selectedStatus} ingestion candidates.
        </p>
      ) : (
        <div className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {candidates.map((candidate) => {
            const selected = candidate.id === selectedCandidateId;

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onSelectCandidate(candidate)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="line-clamp-2 font-medium text-white">
                    {candidate.title || candidate.url}
                  </p>
                  <IngestionCandidateStatusBadge status={candidate.status} />
                </div>

                <p className="break-all text-sm text-blue-300">
                  {candidate.canonical_url ?? candidate.final_url ?? candidate.url}
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
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
