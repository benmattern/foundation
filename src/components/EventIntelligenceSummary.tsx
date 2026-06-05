import type { ArticleWithTags } from "../types/article";
import { Card } from "./ui/Card";

type RelatedTagSummary = {
  id: string;
  name: string;
  count: number;
};

type Props = {
  supportingArticleCount: number;
  newestArticle: ArticleWithTags | null;
  oldestArticle: ArticleWithTags | null;
  eventAge: string;
  lastActivity: string;
  relatedTags: RelatedTagSummary[];
  formatArticleDate: (article: ArticleWithTags | null) => string;
};

export function EventIntelligenceSummary({
  supportingArticleCount,
  newestArticle,
  oldestArticle,
  eventAge,
  lastActivity,
  relatedTags,
  formatArticleDate,
}: Props) {
  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Intelligence Summary
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Derived from this event and its supporting articles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric label="Supporting Articles" value={supportingArticleCount.toString()} />
          <SummaryMetric label="Event Age" value={eventAge} />
          <SummaryMetric
            label="Newest Article"
            value={newestArticle?.title ?? "None"}
            detail={formatArticleDate(newestArticle)}
          />
          <SummaryMetric
            label="Oldest Article"
            value={oldestArticle?.title ?? "None"}
            detail={formatArticleDate(oldestArticle)}
          />
          <SummaryMetric label="Last Activity" value={lastActivity} />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-slate-300">
            Related Tags From Supporting Articles
          </p>

          {relatedTags.length === 0 ? (
            <p className="text-sm text-slate-500">
              No tags found on linked articles.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200"
                >
                  {tag.name} {tag.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

type SummaryMetricProps = {
  label: string;
  value: string;
  detail?: string;
};

function SummaryMetric({ label, value, detail }: SummaryMetricProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-white">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
