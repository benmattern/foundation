import type {
  IngestionCandidate,
  IngestionCandidateStatus,
} from "../types/ingestionCandidate";
import { getIngestionCandidatePreview } from "./ingestionCandidatePreview";

export type QueueFilters = {
  status: IngestionCandidateStatus;
  search: string;
  source: string;
  importSource: string;
};

export function filterCandidates(
  candidates: IngestionCandidate[],
  filters: QueueFilters,
) {
  const query = filters.search.trim().toLowerCase();
  return candidates.filter((candidate) => {
    if (candidate.status !== filters.status) return false;
    if (filters.source === "unknown" && candidate.source_id !== null) {
      return false;
    }
    if (
      !["all", "unknown"].includes(filters.source) &&
      candidate.source_id !== filters.source
    ) return false;
    if (
      filters.importSource !== "all" &&
      candidate.import_source !== filters.importSource
    ) return false;
    return !query ||
      [
        candidate.title,
        candidate.url,
        candidate.canonical_url,
        candidate.final_url,
        candidate.description,
        getIngestionCandidatePreview(candidate),
      ]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
  });
}

export function selectVisibleCandidate(
  candidates: IngestionCandidate[],
  selectedId: string | null,
) {
  return candidates.find((candidate) => candidate.id === selectedId) ??
    candidates[0] ?? null;
}
