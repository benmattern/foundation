import { useEffect, useState } from "react";
import type { Article } from "../types/article";
import type {
  EventStatus,
  FoundationEventWithArticles,
} from "../types/event";
import { eventStatusOptions, eventTypeOptions } from "../types/event";
import { Card } from "./ui/Card";

export type EventFormValues = {
  title: string;
  description: string;
  event_type: string;
  status: EventStatus;
  occurred_at: string;
  location: string;
  article_ids: string[];
};

type Props = {
  articles: Article[];
  mode?: "create" | "edit";
  initialEvent?: FoundationEventWithArticles | null;
  onSubmit: (event: EventFormValues) => Promise<void>;
  onCancel?: () => void;
};

function formatDateForInput(date: string | null): string {
  if (!date) return "";

  return date.slice(0, 10);
}

export function EventForm({
  articles,
  mode = "create",
  initialEvent = null,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState<EventStatus>("draft");
  const [occurredAt, setOccurredAt] = useState("");
  const [location, setLocation] = useState("");
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const isEditing = mode === "edit";

  useEffect(() => {
    if (!initialEvent) {
      setTitle("");
      setDescription("");
      setEventType("");
      setStatus("draft");
      setOccurredAt("");
      setLocation("");
      setSelectedArticleIds([]);
      return;
    }

    setTitle(initialEvent.title);
    setDescription(initialEvent.description ?? "");
    setEventType(initialEvent.event_type ?? "");
    setStatus(initialEvent.status);
    setOccurredAt(formatDateForInput(initialEvent.occurred_at));
    setLocation(initialEvent.location ?? "");
    setSelectedArticleIds(initialEvent.articles.map((article) => article.id));
  }, [initialEvent]);

  function toggleArticle(articleId: string) {
    setSelectedArticleIds((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    await onSubmit({
      title,
      description,
      event_type: eventType,
      status,
      occurred_at: occurredAt,
      location,
      article_ids: selectedArticleIds,
    });

    if (!isEditing) {
      setTitle("");
      setDescription("");
      setEventType("");
      setStatus("draft");
      setOccurredAt("");
      setLocation("");
      setSelectedArticleIds([]);
    }
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? "Edit Event" : "Create Event"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {isEditing
              ? "Update event metadata and linked articles."
              : "Create an analyst-defined event from available articles."}
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Event title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                eventType ? "text-white" : "text-slate-500"
              }`}
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              <option value="">No event type selected</option>
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(event) => setStatus(event.target.value as EventStatus)}
            >
              {eventStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="date"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />

            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-medium text-slate-300">
              Linked Articles
            </p>

            {articles.length === 0 ? (
              <p className="text-sm text-slate-500">
                No articles available to link.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                {articles.map((article) => {
                  const selected = selectedArticleIds.includes(article.id);

                  return (
                    <label
                      key={article.id}
                      className={`block cursor-pointer rounded-lg border p-3 transition ${
                        selected
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-slate-800 bg-slate-900 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleArticle(article.id)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-medium text-white">
                        {article.title}
                      </span>
                      {article.published_at && (
                        <span className="mt-1 block text-xs text-slate-500">
                          Published:{" "}
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-900 transition hover:bg-white">
            {isEditing ? "Save Changes" : "Create Event"}
          </button>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
