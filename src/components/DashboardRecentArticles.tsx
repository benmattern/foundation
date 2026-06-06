import type { ArticleWithTags } from "../types/article";
import { formatDate, getEffectiveArticleDate } from "../lib/eventMetrics";
import { Card } from "./ui/Card";

type Props = {
  articles: ArticleWithTags[];
};

export function DashboardRecentArticles({ articles }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Recent Articles</h2>

      {articles.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No articles have been collected yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="border-b border-slate-800 pb-4">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-white transition hover:text-blue-300"
              >
                {article.title}
              </a>

              {article.summary && (
                <p className="mt-1 text-sm text-slate-400">
                  {article.summary}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">
                  {formatDate(getEffectiveArticleDate(article))}
                </span>

                {article.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
