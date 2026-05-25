import type { Tag } from "../types/tag";

type Props = {
  tags: Tag[];
  onDeleteTag: (id: string) => Promise<void>;
};

export function TagList({ tags, onDeleteTag }: Props) {
  if (tags.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        No tags yet. Create your first tag to begin classifying intelligence records.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="rounded-lg border border-slate-800 bg-slate-900 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">{tag.name}</h3>

              {tag.description && (
                <p className="mt-1 text-sm text-slate-400">
                  {tag.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDeleteTag(tag.id)}
              className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-1 text-sm text-red-300 transition hover:bg-red-900/40"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}