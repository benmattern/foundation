import { supabase } from "../lib/supabaseClient";
import { normalizeImportUrl } from "../lib/urlImport";
import { activeProjectId } from "./projectService";
import { queryAll } from "./queryAll";
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

export function getArticles(): Promise<Article[]> {
  const projectId = activeProjectId();
  return queryAll<Article>((from, to) =>
    supabase.from("articles").select("*")
      .eq("project_id", projectId).order("created_at", { ascending: false })
      .order("id").range(from, to)
  );
}
export async function getArticlesWithTags(): Promise<ArticleWithTags[]> {
  const [articles, articleTags, tags] = await Promise.all([
    getArticles(),
    queryAll<ArticleTag>((from, to) =>
      supabase.from("article_tags").select("*").order("article_id").order(
        "tag_id",
      ).range(from, to)
    ),
    queryAll<Tag>((from, to) =>
      supabase.from("tags").select("*").order("id").range(from, to)
    ),
  ]);
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  return articles.map((article) => ({
    ...article,
    tags: articleTags
      .filter((link) => link.article_id === article.id).map((link) =>
        tagsById.get(link.tag_id)
      )
      .filter((tag): tag is Tag => !!tag).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
  }));
}
export async function getArticlesBySourceId(
  sourceId: string,
): Promise<Article[]> {
  return (await getArticles()).filter((article) =>
    article.source_id === sourceId
  );
}
async function saveArticle(article: CreateArticleInput, id: string | null) {
  const { data, error } = await supabase.rpc("save_article", {
    p_project: activeProjectId(),
    p_id: id,
    p_values: { ...article, url: normalizeImportUrl(article.url) },
  });
  if (error) throw error;
  return data as Article;
}
export const createArticle = (article: CreateArticleInput) =>
  saveArticle(article, null);
export const updateArticle = (id: string, article: UpdateArticleInput) =>
  saveArticle(article, id);
export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.rpc("remove_article", {
    p_project: activeProjectId(),
    p_id: id,
  });
  if (error) throw error;
}
