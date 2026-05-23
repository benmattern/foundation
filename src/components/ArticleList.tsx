import type { Article } from "../types/article";
import { Card } from "./ui/Card";

type Props = {
  articles: Article[];
};

export function ArticleList({ articles }: Props) {
  return (
    <Card>
      <h2 className="text-2xl font-semibold text-white mb-6">
        Articles
      </h2>

      {articles.length === 0 ? (
        <p className="text-slate-400">No articles added yet.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border-b border-slate-800 pb-4"
            >
              <p className="font-medium text-white text-lg">
                {article.title}
              </p>

              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 break-all"
              >
                {article.url}
              </a>

              {article.summary && (
                <p className="text-sm text-slate-400 mt-2">
                  {article.summary}
                </p>
              )}

              {article.published_at && (
                <p className="text-xs text-slate-500 mt-2">
                  Published:{" "}
                  {new Date(article.published_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}