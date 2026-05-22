import { Card } from "./ui/Card";

type Props = {
  sourceCount: number;
};

export function DashboardCards({ sourceCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="p-5">
        <p className="text-sm text-slate-400">Sources</p>
        <p className="text-4xl font-bold text-white">{sourceCount}</p>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-slate-400">Articles</p>
        <p className="text-4xl font-bold text-white">0</p>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-slate-400">Entities</p>
        <p className="text-4xl font-bold text-white">0</p>
      </Card>
    </div>
  );
}