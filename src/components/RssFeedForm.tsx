import { useEffect, useState } from "react";
import { Card } from "./ui/Card";
import type { UpsertRssFeedInput } from "../services/rssFeedService";
import type { RssFeed } from "../types/rssFeed";
import type { Source } from "../types/source";

type Props = {
  feedToEdit: RssFeed | null;
  sources: Source[];
  onSubmit: (feed: UpsertRssFeedInput) => Promise<void>;
  onCancelEdit: () => void;
};

export function RssFeedForm({
  feedToEdit,
  sources,
  onSubmit,
  onCancelEdit,
}: Props) {
  const [feedUrl, setFeedUrl] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!feedToEdit) {
      setFeedUrl("");
      setSourceId("");
      setTitle("");
      setIsActive(true);
      return;
    }

    setFeedUrl(feedToEdit.feed_url);
    setSourceId(feedToEdit.source_id ?? "");
    setTitle(feedToEdit.title ?? "");
    setIsActive(feedToEdit.is_active);
  }, [feedToEdit]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        feed_url: feedUrl,
        source_id: sourceId || null,
        title,
        is_active: isActive,
      });

      if (!feedToEdit) {
        setFeedUrl("");
        setSourceId("");
        setTitle("");
        setIsActive(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {feedToEdit ? "Edit RSS Feed" : "Add RSS Feed"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Feed items are staged as Review Queue candidates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Feed URL
          </label>
          <input
            value={feedUrl}
            onChange={(event) => setFeedUrl(event.target.value)}
            required
            placeholder="https://example.com/rss.xml"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Source
          </label>
          <select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No source selected</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional feed label"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500"
          />
          Active
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : feedToEdit ? "Save Changes" : "Add Feed"}
          </button>

          {feedToEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
