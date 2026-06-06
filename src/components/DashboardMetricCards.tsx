import type { DashboardMetrics } from "../lib/dashboardMetrics";
import { Card } from "./ui/Card";

type Props = {
  metrics: DashboardMetrics;
};

export function DashboardMetricCards({ metrics }: Props) {
  const cards = [
    {
      label: "Active Events",
      value: metrics.activeEventCount,
      helper: "Currently open analyst-defined developments",
    },
    {
      label: "Total Events",
      value: metrics.totalEventCount,
      helper: "Tracked intelligence developments",
    },
    {
      label: "Articles",
      value: metrics.articleCount,
      helper: "Collected supporting intelligence items",
    },
    {
      label: "Sources",
      value: metrics.sourceCount,
      helper: "Managed collection sources",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <p className="text-sm font-medium text-slate-400">{card.label}</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {card.value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
        </Card>
      ))}
    </div>
  );
}
