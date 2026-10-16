import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { useRef, useState } from "react";
import { Card } from "./ui/Card";
import type { ArticleWithTags } from "../types/article";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";

export type ArticleFormValues = {
  source_id: string | null;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  tag_ids: string[];
};

export type ArticleFormDraftValues = Partial<ArticleFormValues>;

type Props = {
  sources: Source[];
  tags: Tag[];
  mode?: "create" | "edit";
  initialArticle?: ArticleWithTags | null;
  initialDraft?: ArticleFormDraftValues | null;
  onSubmit: (article: ArticleFormValues) => Promise<void>;
  onCancel?: () => void;
};

function formatDateForInput(date: string | null): string {
  if (!date) return "";

  return date.slice(0, 10);
}

export function ArticleForm(props: Props) {
  return (
    <ArticleFormFields
      key={JSON.stringify([props.initialArticle, props.initialDraft])}
      {...props}
    />
  );
}

function ArticleFormFields({
  sources,
  tags,
  mode = "create",
  initialArticle = null,
  initialDraft = null,
  onSubmit,
  onCancel,
}: Props) {
  const [sourceId, setSourceId] = useState(
    () => initialArticle?.source_id ?? initialDraft?.source_id ?? "",
  );
  const [title, setTitle] = useState(
    () => initialArticle?.title ?? initialDraft?.title ?? "",
  );
  const [url, setUrl] = useState(
    () => initialArticle?.url ?? initialDraft?.url ?? "",
  );
  const [summary, setSummary] = useState(
    () => initialArticle?.summary ?? initialDraft?.summary ?? "",
  );
  const [publishedAt, setPublishedAt] = useState(() =>
    initialArticle
      ? formatDateForInput(initialArticle.published_at)
      : (initialDraft?.published_at ?? ""),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    () =>
      initialArticle?.tags.map((tag) => tag.id) ?? initialDraft?.tag_ids ?? [],
  );
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isEditing = mode === "edit";

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        source_id: sourceId || null,
        title,
        url,
        summary,
        published_at: publishedAt,
        tag_ids: selectedTagIds,
      });

      if (!isEditing) {
        setTitle("");
        setUrl("");
        setSummary("");
        setPublishedAt("");
        setSourceId("");
        setSelectedTagIds([]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Save failed. Your edits are preserved.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? "Edit article" : "Add article manually"}
          </h2>

          <p className="text-slate-400 mt-1 text-sm">
            {isEditing
              ? "Update article metadata and tags."
              : "Add an article directly to Library after your own review. Automatic collection uses Inbox instead."}
          </p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2 text-sm text-slate-300">
            Source
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
          </label>

          <Input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Article title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Original article URL"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <Input
            label="Published date"
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />

          <Textarea
            label="Summary / analyst notes"
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          {tags.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="mb-3 text-sm font-medium text-slate-300">Tags</p>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);

                  return (
                    <label
                      key={tag.id}
                      className={`inline-flex min-h-11 items-center cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                        selected
                          ? "border-blue-500 bg-blue-500/20 text-blue-200"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTag(tag.id)}
                        className="mr-2"
                      />
                      {tag.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" type="submit" disabled={busy}>
            {isEditing ? "Save Changes" : "Add Article"}
          </Button>

          {isEditing && onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
