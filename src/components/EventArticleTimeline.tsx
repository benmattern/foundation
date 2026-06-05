import type { ArticleWithTags } from "../types/article";
import { Card } from "./ui/Card";

type Props = {
  articles: ArticleWithTags[];
  formatArticleDate: (article: ArticleWithTags) => string;
};

export function EventArticleTimeline({
  articles,
  formatArticleDate,
}: Props) {
  return (
    <Card>
      <h2 className="mb-6 text-2xl font-semibold text-white">
        Supporting Article Timeline
      </h2>

      {articles.length === 0 ? (
        <p className="text-slate-400">No articles linked to this event.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border-b border-slate-800 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {formatArticleDate(article)}
                  </p>
                  <p className="mt-1 text-lg font-medium text-white">
                    {article.title}
                  </p>
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-blue-400 hover:text-blue-300"
                >
                  Open source
                </a>
              </div>

              {article.summary && (
                <p className="mt-2 text-sm text-slate-400">
                  {article.summary}
                </p>
              )}

              {article.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
