import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ArticleForm } from "../components/ArticleForm";
import { ArticleList } from "../components/ArticleList";
import type { ArticleWithTags } from "../types/article";
import {
  getArticlesWithTags,
  createArticle as createArticleRecord,
} from "../services/articleService";
import type { Source } from "../types/source";
import { getSources } from "../services/sourceService";
import type { Tag } from "../types/tag";
import { getTags } from "../services/tagService";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function createArticle(article: {
    source_id: string | null;
    title: string;
    url: string;
    summary: string;
    published_at: string;
    tag_ids: string[];
  }) {
    try {
      await createArticleRecord(article);
      await loadArticles();
    } catch (error) {
      console.error("Error adding article:", error);
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ArticleForm
            sources={sources}
            tags={tags}
            onCreateArticle={createArticle}
          />
          <ArticleList articles={articles} />
        </div>
      )}
    </>
  );
}
