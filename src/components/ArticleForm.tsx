import { useState } from "react";
import { Card } from "./ui/Card";

type Props = {
  onCreateArticle: (article: {
    title: string;
    url: string;
    summary: string;
    published_at: string;
  }) => Promise<void>;
};

export function ArticleForm({ onCreateArticle }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [publishedAt, setPublishedAt] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onCreateArticle({
      title,
      url,
      summary,
      published_at: publishedAt,
    });

    setTitle("");
    setUrl("");
    setSummary("");
    setPublishedAt("");
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
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />

          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 min-h-[180px]"
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <button
          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-white font-medium transition"
        >
          Add Article
        </button>
      </form>
    </Card>
  );
}