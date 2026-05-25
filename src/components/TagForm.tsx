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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500"
        placeholder="Tag name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <textarea
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500"
        placeholder="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        Add Tag
      </button>
    </form>
  );
}