import type { Tag } from "../types/tag";

type Props = {
  tags: Tag[];
  onDeleteTag: (id: string) => Promise<void>;
};

export function TagList({ tags, onDeleteTag }: Props) {
  if (tags.length === 0) {
    return <p className="text-slate-400">No tags yet.</p>;
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
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}