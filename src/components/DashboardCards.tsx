type Props = {
  sourceCount: number;
};

export function DashboardCards({ sourceCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
        <p className="text-sm text-slate-400">Sources</p>
        <p className="text-4xl font-bold text-white">{sourceCount}</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
        <p className="text-sm text-slate-400">Articles</p>
        <p className="text-4xl font-bold text-white">0</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
        <p className="text-sm text-slate-400">Entities</p>
        <p className="text-4xl font-bold text-white">0</p>
      </div>
    </div>
  );
}