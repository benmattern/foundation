import type { ArticleWithTags } from "../types/article";
import { Card } from "./ui/Card";

type Props = {
  articles: ArticleWithTags[];
  highlightId?: string | null;
  emptyMessage?: string;
  onEditArticle?: (article: ArticleWithTags) => void;
  onDeleteArticle?: (article: ArticleWithTags) => void;
};

export function ArticleList({
  articles,
  highlightId,
  emptyMessage = "No articles added yet.",
  onEditArticle,
  onDeleteArticle,
}: Props) {
  return (
    <Card>
      <h2 className="text-2xl font-semibold text-white mb-6">Kept articles</h2>

      {articles.length === 0 ? (
        <p className="text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              id={`article-${article.id}`}
              className={`min-w-0 rounded-lg border-b border-slate-800 p-3 ${highlightId === article.id ? "outline-2 outline-emerald-500" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <p className="font-medium text-white text-lg">
                  {article.title}
                </p>

                {(onEditArticle || onDeleteArticle) && (
                  <div className="flex shrink-0 gap-2">
                    {onEditArticle && (
                      <button
                        type="button"
                        onClick={() => onEditArticle(article)}
                        className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    )}

                    {onDeleteArticle && (
                      <button
                        type="button"
                        onClick={() => onDeleteArticle(article)}
                        className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-1 text-sm text-red-300 transition hover:bg-red-900/40"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 break-all"
              >
                {article.url}
              </a>

              {article.summary && (
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                  <span className="mb-1 block text-xs text-slate-400">
                    Saved summary / analyst notes
                  </span>
                  {article.summary}
                </p>
              )}

              {article.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {article.published_at && (
                <p className="text-xs text-slate-500 mt-2">
                  Published: {new Date(article.published_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
