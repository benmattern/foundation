import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ArticleForm } from "../components/ArticleForm";
import { ArticleList } from "../components/ArticleList";
import { ArticleFilters } from "../components/ArticleFilters";
import type { ArticleWithTags } from "../types/article";
import {
  getArticlesWithTags,
  createArticle as createArticleRecord,
  updateArticle as updateArticleRecord,
  deleteArticle as deleteArticleRecord,
} from "../services/articleService";
import type { ArticleFormValues } from "../components/ArticleForm";
import type { Source } from "../types/source";
import { getSources } from "../services/sourceService";
import type { Tag } from "../types/tag";
import { getTags } from "../services/tagService";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [editingArticle, setEditingArticle] =
    useState<ArticleWithTags | null>(null);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      normalizedSearchQuery === "" ||
      article.title.toLowerCase().includes(normalizedSearchQuery) ||
      (article.summary ?? "").toLowerCase().includes(normalizedSearchQuery);

    const matchesTag =
      selectedTagId === "" ||
      article.tags.some((tag) => tag.id === selectedTagId);

    const matchesSource =
      selectedSourceId === "" || article.source_id === selectedSourceId;

    return matchesSearch && matchesTag && matchesSource;
  });

  function clearFilters() {
    setSearchQuery("");
    setSelectedTagId("");
    setSelectedSourceId("");
  }

  async function loadArticles() {
    try {
      const [articleData, sourceData, tagData] = await Promise.all([
        getArticlesWithTags(),
        getSources(),
        getTags(),
      ]);

      setArticles(articleData);
      setSources(sourceData);
      setTags(tagData);
    } catch (error) {
      console.error("Error loading articles page data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  async function createArticle(article: ArticleFormValues) {
    try {
      await createArticleRecord(article);
      await loadArticles();
    } catch (error) {
      console.error("Error adding article:", error);
    }
  }

  async function updateArticle(article: ArticleFormValues) {
    if (!editingArticle) return;

    try {
      await updateArticleRecord(editingArticle.id, article);
      setEditingArticle(null);
      await loadArticles();
    } catch (error) {
      console.error("Error updating article:", error);
    }
  }

  async function deleteArticle(article: ArticleWithTags) {
    const confirmed = window.confirm(
      `Delete "${article.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteArticleRecord(article.id);

      if (editingArticle?.id === article.id) {
        setEditingArticle(null);
      }

      await loadArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Articles"
        description="Collect, review, and organize articles gathered from OSINT sources."
      />

      {loading ? (
        <p className="text-slate-400">Loading articles...</p>
      ) : (
        <div className="space-y-6">
          <ArticleFilters
            searchQuery={searchQuery}
            selectedTagId={selectedTagId}
            selectedSourceId={selectedSourceId}
            sources={sources}
            tags={tags}
            resultCount={filteredArticles.length}
            totalCount={articles.length}
            onSearchQueryChange={setSearchQuery}
            onSelectedTagIdChange={setSelectedTagId}
            onSelectedSourceIdChange={setSelectedSourceId}
            onClearFilters={clearFilters}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ArticleForm
              sources={sources}
              tags={tags}
              mode={editingArticle ? "edit" : "create"}
              initialArticle={editingArticle}
              onSubmit={editingArticle ? updateArticle : createArticle}
              onCancel={
                editingArticle ? () => setEditingArticle(null) : undefined
              }
            />
            <ArticleList
              articles={filteredArticles}
              emptyMessage="No articles match the current filters."
              onEditArticle={setEditingArticle}
              onDeleteArticle={deleteArticle}
            />
          </div>
        </div>
      )}
    </>
  );
}
