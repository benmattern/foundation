import { useState } from "react";

type Props = {
  onCreateTag: (tag: { name: string; description: string }) => Promise<void>;
};

export function TagForm({ onCreateTag }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) return;

    await onCreateTag({
      name: name.trim(),
      description: description.trim(),
    });

    setName("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Add Tag
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Create topics used to classify intelligence records.
        </p>
      </div>

      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Tag name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <textarea
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <button
        type="submit"
        className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-900 transition hover:bg-white"
      >
        Add Tag
      </button>
    </form>
  );
}