import { useState } from "react";
import { Card } from "./ui/Card";
import type { Source } from "../types/source";

type Props = {
  sources: Source[];
  onCreateArticle: (article: {
    source_id: string | null;
    title: string;
    url: string;
    summary: string;
    published_at: string;
  }) => Promise<void>;
};

export function ArticleForm({ sources, onCreateArticle }: Props) {
  const [sourceId, setSourceId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [publishedAt, setPublishedAt] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onCreateArticle({
      source_id: sourceId || null,
      title,
      url,
      summary,
      published_at: publishedAt,
    });

    setTitle("");
    setUrl("");
    setSummary("");
    setPublishedAt("");
    setSourceId("");
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Add Article
          </h2>

          <p className="text-slate-400 mt-1 text-sm">
            Add a collected article or intelligence item.
          </p>
        </div>

        <div className="space-y-4">
          
          <select
            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              sourceId ? "text-white" : "text-slate-500"
            }`}
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">No source selected</option>

            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>          
          
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />

          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <button
          className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-900 transition hover:bg-white"
        >
          Add Article
        </button>
      </form>
    </Card>
  );
}