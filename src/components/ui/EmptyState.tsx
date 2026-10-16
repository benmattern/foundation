import type { ReactNode } from "react";
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="max-w-2xl text-slate-300">{children}</div>
      {action && <div className="flex flex-wrap gap-3 pt-2">{action}</div>}
    </section>
  );
}
