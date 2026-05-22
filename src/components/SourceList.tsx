import type { Source } from "../types/source";
import { Card } from "./ui/Card";

type Props = {
  sources: Source[];
};

export function SourceList({ sources }: Props) {
  return (
    <Card>
      <h3 className="text-xl font-semibold text-white mb-6">Sources</h3>

      <div className="space-y-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="border-b border-slate-800 pb-4"
          >
            <p className="font-medium text-white text-lg">
              {source.name}
            </p>

            <p className="text-sm text-blue-400 break-all">
              {source.url}
            </p>

            {source.category && (
              <p className="text-sm text-slate-400 mt-1">
                {source.category}
              </p>
            )}

            {source.notes && (
              <p className="text-sm text-slate-500 mt-2">
                {source.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}