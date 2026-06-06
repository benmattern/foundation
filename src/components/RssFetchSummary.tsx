import { Card } from "./ui/Card";
import type { RssFetchSummary as RssFetchSummaryType } from "../types/rssFeed";

type Props = {
  summary: RssFetchSummaryType | null;
};

export function RssFetchSummary({ summary }: Props) {
  if (!summary) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Latest Fetch
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {summary.feedTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryStat label="Fetched" value={summary.fetchedItemCount} />
          <SummaryStat label="Created" value={summary.createdCandidateCount} />
          <SummaryStat label="Skipped" value={summary.skippedDuplicateCount} />
        </div>

        {(summary.warnings.length > 0 || summary.errors.length > 0) && (
          <div className="space-y-2 text-sm">
            {summary.warnings.map((warning) => (
              <p key={warning} className="text-amber-300">
                {warning}
              </p>
            ))}

            {summary.errors.map((error) => (
              <p key={error} className="text-red-300">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
