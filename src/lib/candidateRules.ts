import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { SearchableItem } from "../../supabase/functions/_shared/rules";
export function candidateEvidence(
  candidate: IngestionCandidate,
): SearchableItem {
  const original = candidate.original_acquisition ?? {};
  const item = (candidate.raw_metadata.item ?? {}) as Record<string, unknown>;
  return {
    title: "title" in original
      ? typeof original.title === "string" ? original.title : null
      : candidate.title,
    description: "description" in original
      ? typeof original.description === "string" ? original.description : null
      : candidate.description,
    categories:
      (Array.isArray(original.categories)
        ? original.categories
        : Array.isArray(item.categories)
        ? item.categories
        : []).filter((c): c is string => typeof c === "string"),
  };
}
