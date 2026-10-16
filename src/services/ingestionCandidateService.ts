import { supabase } from "../lib/supabaseClient";
import { normalizeImportUrl } from "../lib/urlImport";
import { activeProjectId } from "./projectService";
import { queryAll } from "./queryAll";
import type { CreateArticleInput } from "./articleService";
import type {
  IngestionCandidate,
  IngestionImportSource,
} from "../types/ingestionCandidate";

export type CreateIngestionCandidateInput = {
  url: string;
  canonical_url?: string | null;
  final_url?: string | null;
  source_id?: string | null;
  title?: string | null;
  description?: string | null;
  published_at?: string | null;
  import_source: IngestionImportSource;
  raw_metadata?: Record<string, unknown>;
  warnings?: unknown[];
};
export type UpdateIngestionCandidateInput = {
  url: string;
  canonical_url: string | null;
  final_url: string | null;
  source_id: string | null;
  title: string | null;
  description: string | null;
  published_at: string | null;
  tag_ids?: string[];
};
export type AcceptIngestionCandidateInput = CreateArticleInput;
export type CandidateQuery = {
  status: string;
  route?: string;
  search?: string;
  source?: string;
  importSource?: string;
  tag?: string;
  since?: string;
  until?: string;
  page: number;
};

export async function queryCandidates(filters: CandidateQuery) {
  const { data, error } = await supabase.rpc("search_candidates", {
    p_project: activeProjectId(),
    p_filters: filters,
    p_search: filters.search?.trim() ?? "",
  });
  if (error) throw error;
  return {
    candidates: (data?.items ?? []) as IngestionCandidate[],
    count: Number(data?.count ?? 0),
  };
}
export function getIngestionCandidates(): Promise<IngestionCandidate[]> {
  const projectId = activeProjectId();
  return queryAll<IngestionCandidate>((from, to) =>
    supabase.from("ingestion_candidates").select("*")
      .eq("project_id", projectId).order("created_at", { ascending: false })
      .order("id").range(from, to)
  );
}
export async function createIngestionCandidate(
  candidate: CreateIngestionCandidateInput,
): Promise<IngestionCandidate> {
  const { data, error } = await supabase.rpc("capture_candidate", {
    p_project: activeProjectId(),
    p_values: {
      ...candidate,
      url: normalizeImportUrl(candidate.url),
      canonical_url: candidate.canonical_url
        ? normalizeImportUrl(candidate.canonical_url)
        : null,
      final_url: candidate.final_url
        ? normalizeImportUrl(candidate.final_url)
        : null,
    },
  });
  if (error) throw error;
  return data;
}
export async function reviewCandidate(
  id: string,
  action: string,
  values: Record<string, unknown> = {},
): Promise<IngestionCandidate> {
  const { data, error } = await supabase.rpc("review_candidate", {
    p_id: id,
    p_action: action,
    p_values: values,
  });
  if (error) throw error;
  return data;
}
export const updateIngestionCandidate = (
  id: string,
  values: UpdateIngestionCandidateInput,
) => reviewCandidate(id, "save", values);
export async function rejectIngestionCandidate(
  id: string,
  rejectionReason?: string,
) {
  await reviewCandidate(id, "reject", {
    rejection_reason: rejectionReason || null,
  });
}
export async function markIngestionCandidateDuplicate(id: string) {
  await reviewCandidate(id, "duplicate");
}
export async function acceptIngestionCandidate(
  id: string,
  article: AcceptIngestionCandidateInput,
) {
  await reviewCandidate(id, "accept", {
    ...article,
    description: article.summary,
  });
}
export type BulkOutcome = { id: string; ok: boolean; error?: string };
export async function bulkReview(
  ids: string[],
  action: string,
  tag: string | null,
): Promise<BulkOutcome[]> {
  const { data, error } = await supabase.rpc("bulk_review", {
    p_project: activeProjectId(),
    p_ids: ids,
    p_action: action,
    p_tag: tag,
  });
  if (error) throw error;
  return data;
}
export async function getBulkHistory(): Promise<
  { id: string; action: string; created_at: string; results: BulkOutcome[] }[]
> {
  const { data, error } = await supabase.from("bulk_review_runs").select("*")
    .eq("project_id", activeProjectId()).order("created_at", {
      ascending: false,
    }).limit(10);
  if (error) throw error;
  return data ?? [];
}
