import { useEffect, useState } from "react";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";
import { Card } from "./ui/Card";
import { IngestionCandidateStatusBadge } from "./IngestionCandidateStatusBadge";

export type IngestionCandidateReviewValues = {
  url: string;
  canonical_url: string;
  final_url: string;
  source_id: string;
  title: string;
  description: string;
  published_at: string;
  tag_ids: string[];
  rejection_reason: string;
};

type Props = {
  candidate: IngestionCandidate | null;
  sources: Source[];
  tags: Tag[];
  onAcceptCandidate: (
    candidate: IngestionCandidate,
    values: IngestionCandidateReviewValues
  ) => Promise<void>;
  onRejectCandidate: (
    candidate: IngestionCandidate,
    rejectionReason: string
  ) => Promise<void>;
  onMarkDuplicate: (candidate: IngestionCandidate) => Promise<void>;
};

function formatDateForInput(date: string | null): string {
  if (!date) return "";

  return date.slice(0, 10);
}

export function IngestionCandidateReview({
  candidate,
  sources,
  tags,
  onAcceptCandidate,
  onRejectCandidate,
  onMarkDuplicate,
}: Props) {
  const [values, setValues] = useState<IngestionCandidateReviewValues>({
    url: "",
    canonical_url: "",
    final_url: "",
    source_id: "",
    title: "",
    description: "",
    published_at: "",
    tag_ids: [],
    rejection_reason: "",
  });

  useEffect(() => {
    if (!candidate) return;

    setValues({
      url: candidate.url,
      canonical_url: candidate.canonical_url ?? "",
      final_url: candidate.final_url ?? "",
      source_id: candidate.source_id ?? "",
      title: candidate.title ?? "",
      description: candidate.description ?? "",
      published_at: formatDateForInput(candidate.published_at),
      tag_ids: [],
      rejection_reason: "",
    });
  }, [candidate]);

  function updateValue<K extends keyof IngestionCandidateReviewValues>(
    key: K,
    value: IngestionCandidateReviewValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleTag(tagId: string) {
    setValues((current) => ({
      ...current,
      tag_ids: current.tag_ids.includes(tagId)
        ? current.tag_ids.filter((id) => id !== tagId)
        : [...current.tag_ids, tagId],
    }));
  }

  if (!candidate) {
    return (
      <Card>
        <h2 className="mb-2 text-2xl font-semibold text-white">
          Candidate Review
        </h2>
        <p className="text-slate-400">
          Select an ingestion candidate to review its metadata and convert it
          into an approved article.
        </p>
      </Card>
    );
  }

  const actionable = candidate.status === "pending";

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Candidate Review
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Edit candidate metadata before accepting it as an article.
          </p>
        </div>
        <IngestionCandidateStatusBadge status={candidate.status} />
      </div>

      <div className="space-y-4">
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="URL"
          value={values.url}
          onChange={(event) => updateValue("url", event.target.value)}
        />

        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Canonical URL"
          value={values.canonical_url}
          onChange={(event) => updateValue("canonical_url", event.target.value)}
        />

        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Final URL"
          value={values.final_url}
          onChange={(event) => updateValue("final_url", event.target.value)}
        />

        <select
          className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            values.source_id ? "text-white" : "text-slate-500"
          }`}
          value={values.source_id}
          onChange={(event) => updateValue("source_id", event.target.value)}
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
          value={values.title}
          onChange={(event) => updateValue("title", event.target.value)}
        />

        <input
          type="date"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={values.published_at}
          onChange={(event) => updateValue("published_at", event.target.value)}
        />

        <textarea
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description / summary"
          value={values.description}
          onChange={(event) => updateValue("description", event.target.value)}
        />

        {tags.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-medium text-slate-300">
              Tags for accepted article
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = values.tag_ids.includes(tag.id);

                return (
                  <label
                    key={tag.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/20 text-blue-200"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleTag(tag.id)}
                      className="sr-only"
                    />
                    {tag.name}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {candidate.warnings.length > 0 && (
          <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-medium">Warnings</p>
            {candidate.warnings.map((warning, index) => (
              <p key={`${candidate.id}-warning-${index}`}>
                {typeof warning === "string"
                  ? warning
                  : JSON.stringify(warning)}
              </p>
            ))}
          </div>
        )}

        <textarea
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional rejection reason"
          value={values.rejection_reason}
          onChange={(event) =>
            updateValue("rejection_reason", event.target.value)
          }
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!actionable || !values.title || !values.url}
            onClick={() => onAcceptCandidate(candidate, values)}
            className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Accept as Article
          </button>

          <button
            type="button"
            disabled={!actionable}
            onClick={() =>
              onRejectCandidate(candidate, values.rejection_reason)
            }
            className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 font-medium text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>

          <button
            type="button"
            disabled={!actionable}
            onClick={() => onMarkDuplicate(candidate)}
            className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Duplicate
          </button>
        </div>
      </div>
    </Card>
  );
}
