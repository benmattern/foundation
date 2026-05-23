import { supabase } from "../lib/supabaseClient";
import type { Article } from "../types/article";

export type CreateArticleInput = {
  source_id: string | null;
  title: string;
  url: string;
  summary: string;
  published_at: string;
};

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getArticlesBySourceId(sourceId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createArticle(
  article: CreateArticleInput
): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .insert({
      source_id: article.source_id,
      title: article.title,
      url: article.url,
      summary: article.summary || null,
      published_at: article.published_at
        ? new Date(article.published_at).toISOString()
        : null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}