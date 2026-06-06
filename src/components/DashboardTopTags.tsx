import type { DashboardTagSummary } from "../lib/dashboardMetrics";
import { Card } from "./ui/Card";

type Props = {
  tags: DashboardTagSummary[];
};

export function DashboardTopTags({ tags }: Props) {
  const maxCount = Math.max(...tags.map((tag) => tag.count), 0);

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Top Tags</h2>

      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No article tags available yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {tags.map((tag) => {
            const width = maxCount > 0 ? `${(tag.count / maxCount) * 100}%` : "0%";

            return (
              <div key={tag.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{tag.name}</p>
                  <p className="text-sm text-slate-400">
                    {tag.count} article{tag.count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
