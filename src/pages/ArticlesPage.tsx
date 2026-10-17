import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { EmptyState } from "../components/ui/EmptyState";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ArticleForm } from "../components/ArticleForm";
import type { ArticleFormDraftValues } from "../components/ArticleForm";
import { ArticleList } from "../components/ArticleList";
import { ArticleFilters } from "../components/ArticleFilters";
import { ArticleUrlImport } from "../components/ArticleUrlImport";
import type { UrlImportResult } from "../lib/urlImport";
import type { UrlMetadataResponse } from "../types/urlMetadata";
import type { ArticleWithTags } from "../types/article";
import {
  createArticle as createArticleRecord,
  deleteArticle as deleteArticleRecord,
  getArticlesWithTags,
  updateArticle as updateArticleRecord,
} from "../services/articleService";
import { createIngestionCandidate } from "../services/ingestionCandidateService";
import type { ArticleFormValues } from "../components/ArticleForm";
import type { Source } from "../types/source";
import { getSources } from "../services/sourceService";
import type { Tag } from "../types/tag";
import { getTags } from "../services/tagService";
import { WorkingViews } from "../components/WorkingViews";
import { resolveView } from "../lib/workingViews";

export default function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const [manualOpen, setManualOpen] = useState(false);
  const [error, setError] = useState("");
  const [captureMessage, setCaptureMessage] = useState("");
  const captureOpen = params.get("capture") === "1";
  const highlight = params.get("article");
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [researchSelection, setResearchSelection] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const searchQuery = params.get("q") ?? "";
  const selectedTagId = params.get("tag") ?? "";
  const selectedSourceId = params.get("source") ?? "";
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (key === "since" || key === "until") next.delete("period");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  const setSearchQuery = (v: string) => filter("q", v);
  const setSelectedTagId = (v: string) => filter("tag", v);
  const setSelectedSourceId = (v: string) => filter("source", v);
  const [editingArticle, setEditingArticle] = useState<ArticleWithTags | null>(
    null,
  );
  const [articleDraft, setArticleDraft] =
    useState<ArticleFormDraftValues | null>(null);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch =
        normalizedSearchQuery === "" ||
        article.title.toLowerCase().includes(normalizedSearchQuery) ||
        (article.summary ?? "").toLowerCase().includes(normalizedSearchQuery);

      const matchesTag =
        selectedTagId === "" ||
        article.tags.some((tag) => tag.id === selectedTagId);

      const matchesSource =
        selectedSourceId === "" ||
        selectedSourceId === "all" ||
        article.source_id === selectedSourceId;

      const resolved = resolveView(Object.fromEntries(params));
      const since = resolved.get("since"),
        until = resolved.get("until");
      const date = article.published_at ?? article.created_at;
      return (
        matchesSearch &&
        matchesTag &&
        matchesSource &&
        (!since || new Date(date) >= new Date(since)) &&
        (!until ||
          new Date(date) < new Date(new Date(until).getTime() + 86400000))
      );
    })
    .sort((a, b) =>
      params.get("order") === "oldest"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );
  const missingReference = !!(
    (selectedSourceId &&
      selectedSourceId !== "all" &&
      !sources.some((s) => s.id === selectedSourceId)) ||
    (selectedTagId && !tags.some((t) => t.id === selectedTagId))
  );

  function clearFilters() {
    setParams({});
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
      setError("Library could not load. Refresh to retry. " + String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([getArticlesWithTags(), getSources(), getTags()])
      .then(([articleData, sourceData, tagData]) => {
        if (active) {
          setArticles(articleData);
          setSources(sourceData);
          setTags(tagData);
        }
      })
      .catch((error: unknown) => {
        if (active)
          setError(
            "Library could not load. Refresh to retry. " + String(error),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function createArticle(article: ArticleFormValues) {
    try {
      await createArticleRecord(article);
      setArticleDraft(null);
      await loadArticles();
    } catch (error) {
      console.error("Error adding article:", error);
      throw error;
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
      throw error;
    }
  }

  async function deleteArticle(article: ArticleWithTags) {
    const confirmed = window.confirm(
      `Delete "${article.title}"? The article and its tag/event links will be removed. Research prose and citation snapshots remain, marked unavailable. This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteArticleRecord(article.id);

      if (editingArticle?.id === article.id) {
        setEditingArticle(null);
      }

      await loadArticles();
    } catch (error) {
      setError("Article could not be deleted. " + String(error));
    }
  }

  function importArticleDraft(
    result: UrlImportResult,
    metadata?: UrlMetadataResponse,
  ) {
    const metadataUrl =
      metadata?.canonicalUrl ?? metadata?.finalUrl ?? result.normalizedUrl;

    setEditingArticle(null);
    setArticleDraft({
      source_id: result.matchedSource?.id ?? null,
      title: metadata?.title ?? "",
      url: metadataUrl,
      summary: metadata?.description ?? "",
      published_at: metadata?.publishedAt
        ? metadata.publishedAt.slice(0, 10)
        : "",
    });
  }

  function editArticle(article: ArticleWithTags) {
    setArticleDraft(null);
    setEditingArticle(article);
    setManualOpen(true);
  }

  async function saveImportToQueue(
    result: UrlImportResult,
    metadata?: UrlMetadataResponse,
  ) {
    const warnings = [
      ...(metadata?.warnings ?? []),
      ...(result.duplicateArticle
        ? [`Possible duplicate article: ${result.duplicateArticle.title}`]
        : []),
    ];

    await createIngestionCandidate({
      url: result.normalizedUrl,
      canonical_url: metadata?.canonicalUrl ?? null,
      final_url: metadata?.finalUrl ?? null,
      source_id: result.matchedSource?.id ?? null,
      title: metadata?.title ?? null,
      description: metadata?.description ?? null,
      published_at: metadata?.publishedAt ?? null,
      import_source: "manual_url",
      raw_metadata: metadata ? { ...metadata } : {},
      warnings,
    });
    setCaptureMessage(
      "Link saved to Inbox for your review. It has not been added to Library.",
    );
  }

  return (
    <>
      <PageHeader
        title="Library"
        description="Articles you've kept for this project."
      />
      <WorkingViews surface="articles" />
      {missingReference && !loading && (
        <p role="alert">
          A saved source or tag is unavailable. No broader results have been
          substituted. Clear filters or edit this view.
        </p>
      )}
      <div className="mb-4 flex flex-wrap gap-3">
        <label>
          From (publication, otherwise kept date)
          <input
            type="date"
            value={params.get("since")?.slice(0, 10) ?? ""}
            onChange={(e) => filter("since", e.target.value)}
          />
        </label>
        <label>
          Through
          <input
            type="date"
            value={params.get("until") ?? ""}
            onChange={(e) => filter("until", e.target.value)}
          />
        </label>
        <label>
          Sort
          <select
            value={params.get("order") ?? "newest"}
            onChange={(e) => filter("order", e.target.value)}
          >
            <option value="newest">Newest kept</option>
            <option value="oldest">Oldest kept</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-red-300">
          {error}
        </p>
      )}
      {highlight && articles.some((a) => a.id === highlight) && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-emerald-700 p-4 text-emerald-200"
        >
          Your kept article is highlighted below.
        </p>
      )}
      <div className="mb-5 flex flex-wrap gap-3">
        <Link className={buttonClass()} to="/articles?capture=1">
          Capture a link
        </Link>
        <Button onClick={() => setManualOpen((v) => !v)}>
          Add article manually
        </Button>
      </div>
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

          {articles.length === 0 && !error && (
            <EmptyState
              title="Your library starts with a decision"
              action={
                <Link className={buttonClass("primary")} to="/ingestion">
                  Review inbox
                </Link>
              }
            >
              Collection brings material to Inbox. Keep relevant items there to
              add them to this project's Library, or add an article manually.
            </EmptyState>
          )}
          {captureMessage && (
            <div
              role="status"
              className="space-y-3 rounded-lg border border-blue-700 p-4"
            >
              <p>{captureMessage}</p>
              <Link className={buttonClass()} to="/ingestion">
                Open inbox
              </Link>
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-6">
              {!editingArticle && captureOpen && (
                <ArticleUrlImport
                  articles={articles}
                  sources={sources}
                  onImportDraft={importArticleDraft}
                  onSaveToQueue={saveImportToQueue}
                />
              )}

              {(manualOpen || editingArticle || articleDraft) && (
                <ArticleForm
                  sources={sources}
                  tags={tags}
                  mode={editingArticle ? "edit" : "create"}
                  initialArticle={editingArticle}
                  initialDraft={articleDraft}
                  onSubmit={editingArticle ? updateArticle : createArticle}
                  onCancel={
                    editingArticle ? () => setEditingArticle(null) : undefined
                  }
                />
              )}
            </div>
            {articles.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <Link
                  className={buttonClass()}
                  to={`/research?articles=${researchSelection.filter((id) => articles.some((a) => a.id === id)).join(",")}`}
                >
                  Create research question
                </Link>
                <Link
                  className={buttonClass()}
                  to={`/research?articles=${researchSelection.filter((id) => articles.some((a) => a.id === id)).join(",")}`}
                >
                  Add selected to question ({researchSelection.length})
                </Link>
                <Button onClick={() => setResearchSelection([])}>
                  Clear research selection
                </Button>
              </div>
            )}
            <ArticleList
              selectedIds={researchSelection}
              onSelect={(id, selected) =>
                setResearchSelection((s) =>
                  selected ? [...s, id] : s.filter((v) => v !== id),
                )
              }
              highlightId={highlight}
              articles={filteredArticles}
              emptyMessage="No articles match the current filters."
              onEditArticle={editArticle}
              onDeleteArticle={deleteArticle}
            />
          </div>
        </div>
      )}
    </>
  );
}
