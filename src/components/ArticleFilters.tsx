import type { Source } from "../types/source";
import type { Tag } from "../types/tag";
import { Card } from "./ui/Card";

type Props = {
  searchQuery: string;
  selectedTagId: string;
  selectedSourceId: string;
  sources: Source[];
  tags: Tag[];
  resultCount: number;
  totalCount: number;
  onSearchQueryChange: (value: string) => void;
  onSelectedTagIdChange: (value: string) => void;
  onSelectedSourceIdChange: (value: string) => void;
  onClearFilters: () => void;
};

export function ArticleFilters({
  searchQuery,
  selectedTagId,
  selectedSourceId,
  sources,
  tags,
  resultCount,
  totalCount,
  onSearchQueryChange,
  onSelectedTagIdChange,
  onSelectedSourceIdChange,
  onClearFilters,
}: Props) {
  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedTagId !== "" || selectedSourceId !== "";

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Filter Articles
            </h2>
            <p className="text-sm text-slate-400">
              Showing {resultCount} of {totalCount} articles.
            </p>
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search title or summary"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />

          <select
            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedTagId ? "text-white" : "text-slate-500"
            }`}
            value={selectedTagId}
            onChange={(event) => onSelectedTagIdChange(event.target.value)}
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          <select
            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedSourceId ? "text-white" : "text-slate-500"
            }`}
            value={selectedSourceId}
            onChange={(event) => onSelectedSourceIdChange(event.target.value)}
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
