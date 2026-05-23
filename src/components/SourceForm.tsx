import { useState } from "react";
import { Card } from "./ui/Card";

type Props = {
  onCreateSource: (source: {
    name: string;
    url: string;
    category: string;
    notes: string;
  }) => Promise<void>;
};

export function SourceForm({ onCreateSource }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onCreateSource({ name, url, category, notes });

    setName("");
    setUrl("");
    setCategory("");
    setNotes("");
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Add Source
          </h2>

          <p className="text-slate-400 mt-1 text-sm">
            Add a new OSINT source to the database.
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Source name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-white font-medium transition"
          >
            Add Source
          </button>
        </div>
      </form>
    </Card> 
  );
}