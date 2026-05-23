import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ArticleForm } from "../components/ArticleForm";
import { ArticleList } from "../components/ArticleList";
import type { Article } from "../types/article";
import {
  getArticles,
  createArticle as createArticleRecord,
} from "../services/articleService";
import type { Source } from "../types/source";
import { getSources } from "../services/sourceService";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadArticles() {
    try {
      const [articleData, sourceData] = await Promise.all([
        getArticles(),
        getSources(),
      ]);

      setArticles(articleData);
      setSources(sourceData);
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
  }) {
    try {
      const data = await createArticleRecord(article);

      setArticles((prev) => [data, ...prev]);
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
            onCreateArticle={createArticle}
          />
          <ArticleList articles={articles} />
        </div>
      )}
    </>
  );
}