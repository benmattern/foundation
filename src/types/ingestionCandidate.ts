export type IngestionCandidateStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "duplicate";

export type IngestionImportSource =
  | "manual_url"
  | "rss"
  | "browser_extension"
  | "connector";

export type IngestionCandidate = {
  id: string;
  url: string;
  canonical_url: string | null;
  final_url: string | null;
  source_id: string | null;
  title: string | null;
  description: string | null;
  published_at: string | null;
  import_source: IngestionImportSource;
  status: IngestionCandidateStatus;
  raw_metadata: Record<string, unknown>;
  warnings: unknown[];
  converted_article_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};
