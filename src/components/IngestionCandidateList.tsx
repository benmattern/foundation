import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import { IngestionCandidateStatusBadge } from "./IngestionCandidateStatusBadge";
import { Card } from "./ui/Card";

type Props = {
  candidates: IngestionCandidate[];
  sources: Source[];
  selectedCandidateId?: string | null;
  onSelectCandidate: (candidate: IngestionCandidate) => void;
};

export function IngestionCandidateList({
  candidates,
  sources,
  selectedCandidateId = null,
  onSelectCandidate,
}: Props) {
  function getSourceName(sourceId: string | null): string {
    if (!sourceId) return "No source match";

    return sources.find((source) => source.id === sourceId)?.name ?? "Unknown source";
  }

  return (
    <Card>
      <h2 className="mb-6 text-2xl font-semibold text-white">
        Review Queue
      </h2>

      {candidates.length === 0 ? (
        <p className="text-slate-400">No ingestion candidates yet.</p>
      ) : (
        <div className="space-y-3">
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
