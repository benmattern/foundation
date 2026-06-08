import type { IngestionCandidate } from "../types/ingestionCandidate";

export function getIngestionCandidatePreview(
  candidate: IngestionCandidate
): string | null {
  return (
    normalizePreviewText(candidate.description) ??
    getRawMetadataText(candidate.raw_metadata, "description") ??
    getRawMetadataText(candidate.raw_metadata, "summary")
  );
}

function getRawMetadataText(
  rawMetadata: unknown,
  key: "description" | "summary"
): string | null {
  if (!rawMetadata || typeof rawMetadata !== "object") {
    return null;
  }

  const value = (rawMetadata as Record<string, unknown>)[key];

  return normalizePreviewText(value);
}

function normalizePreviewText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized || null;
}
