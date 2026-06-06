import { supabase } from "../lib/supabaseClient";
import { createArticle } from "./articleService";
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
};

export type AcceptIngestionCandidateInput = CreateArticleInput;

export async function getIngestionCandidates(): Promise<IngestionCandidate[]> {
  const { data, error } = await supabase
    .from("ingestion_candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as IngestionCandidate[];
}

export async function createIngestionCandidate(
  candidate: CreateIngestionCandidateInput
): Promise<IngestionCandidate> {
  const { data, error } = await supabase
    .from("ingestion_candidates")
    .insert({
      url: candidate.url,
      canonical_url: candidate.canonical_url ?? null,
      final_url: candidate.final_url ?? null,
      source_id: candidate.source_id ?? null,
      title: candidate.title ?? null,
      description: candidate.description ?? null,
      published_at: candidate.published_at
        ? new Date(candidate.published_at).toISOString()
        : null,
      import_source: candidate.import_source,
      status: "pending",
      raw_metadata: candidate.raw_metadata ?? {},
      warnings: candidate.warnings ?? [],
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as IngestionCandidate;
}

export async function updateIngestionCandidate(
  id: string,
  candidate: UpdateIngestionCandidateInput
): Promise<IngestionCandidate> {
  const { data, error } = await supabase
    .from("ingestion_candidates")
    .update({
      url: candidate.url,
      canonical_url: candidate.canonical_url,
      final_url: candidate.final_url,
      source_id: candidate.source_id,
      title: candidate.title,
      description: candidate.description,
      published_at: candidate.published_at
        ? new Date(candidate.published_at).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as IngestionCandidate;
}

export async function rejectIngestionCandidate(
  id: string,
  rejectionReason?: string
): Promise<void> {
  const { error } = await supabase
    .from("ingestion_candidates")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function markIngestionCandidateDuplicate(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("ingestion_candidates")
    .update({
      status: "duplicate",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function acceptIngestionCandidate(
  id: string,
  article: AcceptIngestionCandidateInput
): Promise<void> {
  const createdArticle = await createArticle(article);
  const { error } = await supabase
    .from("ingestion_candidates")
    .update({
      status: "accepted",
      converted_article_id: createdArticle.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
