import { supabase } from "../lib/supabaseClient";
import type { Article, ArticleWithTags } from "../types/article";
import type { ArticleTag, Tag } from "../types/tag";

export type CreateArticleInput = {
  source_id: string | null;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  tag_ids?: string[];
};

export type UpdateArticleInput = CreateArticleInput;

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

export async function getArticlesWithTags(): Promise<ArticleWithTags[]> {
  const [articles, articleTags, tags] = await Promise.all([
    getArticles(),
    getArticleTags(),
    getTagsForArticles(),
  ]);

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagIdsByArticleId = articleTags.reduce<Map<string, string[]>>(
    (map, articleTag) => {
      const current = map.get(articleTag.article_id) ?? [];
      current.push(articleTag.tag_id);
      map.set(articleTag.article_id, current);

      return map;
    },
    new Map()
  );

  return articles.map((article) => ({
    ...article,
    tags: (tagIdsByArticleId.get(article.id) ?? [])
      .map((tagId) => tagsById.get(tagId))
      .filter((tag): tag is Tag => Boolean(tag))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
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

  if (article.tag_ids && article.tag_ids.length > 0) {
    await setArticleTags(data.id, article.tag_ids);
  }

  return data;
}

export async function updateArticle(
  id: string,
  article: UpdateArticleInput
): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .update({
      source_id: article.source_id,
      title: article.title,
      url: article.url,
      summary: article.summary || null,
      published_at: article.published_at
        ? new Date(article.published_at).toISOString()
        : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await replaceArticleTags(id, article.tag_ids ?? []);

  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function setArticleTags(
  articleId: string,
  tagIds: string[]
): Promise<void> {
  const uniqueTagIds = [...new Set(tagIds)];

  if (uniqueTagIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("article_tags")
    .insert(
      uniqueTagIds.map((tagId) => ({
        article_id: articleId,
        tag_id: tagId,
      }))
    );

  if (error) {
    throw error;
  }
}

async function replaceArticleTags(
  articleId: string,
  tagIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("article_tags")
    .delete()
    .eq("article_id", articleId);

  if (deleteError) {
    throw deleteError;
  }

  await setArticleTags(articleId, tagIds);
}

async function getArticleTags(): Promise<ArticleTag[]> {
  const { data, error } = await supabase
    .from("article_tags")
    .select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getTagsForArticles(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
