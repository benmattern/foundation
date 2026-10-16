import { CandidatePreviewPane } from "./CandidatePreviewPane";
import { Button } from "./ui/Button";
import { useRef, useState } from "react";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";
import { getIngestionCandidatePreview } from "../lib/ingestionCandidatePreview";
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
    values: IngestionCandidateReviewValues,
  ) => Promise<void>;
  onRejectCandidate: (
    candidate: IngestionCandidate,
    rejectionReason: string,
  ) => Promise<void>;
  onLaterCandidate?: (candidate: IngestionCandidate) => Promise<void>;
  onMarkDuplicate: (candidate: IngestionCandidate) => Promise<void>;
  onSaveCandidate?: (
    candidate: IngestionCandidate,
    values: IngestionCandidateReviewValues,
  ) => Promise<void>;
};

function formatDateForInput(date: string | null): string {
  if (!date) return "";

  return date.slice(0, 10);
}

function formatDisplayDate(date: string): string {
  if (!date) return "Published date unknown";

  return new Date(
    date.length === 10 ? `${date}T00:00:00` : date,
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatImportSource(importSource: string): string {
  return importSource
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function IngestionCandidateReview(props: Props) {
  return (
    <CandidateReviewFields key={props.candidate?.id ?? "empty"} {...props} />
  );
}

function CandidateReviewFields({
  candidate,
  sources,
  tags,
  onAcceptCandidate,
  onRejectCandidate,
  onMarkDuplicate,
  onLaterCandidate,
  onSaveCandidate,
}: Props) {
  const [values, setValues] = useState<IngestionCandidateReviewValues>(() => ({
    url: candidate?.url ?? "",
    canonical_url: candidate?.canonical_url ?? "",
    final_url: candidate?.final_url ?? "",
    source_id: candidate?.source_id ?? "",
    title: candidate?.title ?? "",
    description: candidate?.description ?? "",
    published_at: formatDateForInput(candidate?.published_at ?? null),
    tag_ids: candidate?.tag_ids ?? [],
    rejection_reason: "",
  }));
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Review failed. Your edits are preserved.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function updateValue<K extends keyof IngestionCandidateReviewValues>(
    key: K,
    value: IngestionCandidateReviewValues[K],
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
        <h2 className="mb-2 text-2xl font-semibold text-white">Review item</h2>
        <p className="text-slate-400">
          Select an incoming item to review. Keeping adds it to Library.
        </p>
      </Card>
    );
  }

  const actionable = candidate.status === "pending" && !busy;
  const preview =
    getIngestionCandidatePreview(candidate) ?? "No preview available.";
  const sourceName =
    sources.find((source) => source.id === values.source_id)?.name ??
    "Unknown source";
  const actionRow = (
    <div className="flex flex-wrap gap-3">
      {onSaveCandidate && (
        <Button
          type="button"
          disabled={!actionable}
          onClick={() => void review(() => onSaveCandidate(candidate, values))}
        >
          Save draft and tags
        </Button>
      )}
      {onLaterCandidate && (
        <Button
          disabled={!actionable}
          onClick={() => void review(() => onLaterCandidate(candidate))}
        >
          Later
        </Button>
      )}
      <Button
        disabled={!actionable}
        onClick={() => void review(() => onMarkDuplicate(candidate))}
      >
        Duplicate
      </Button>
      {values.url && (
        <a
          href={values.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 font-medium text-blue-200 transition hover:bg-blue-500/20"
        >
          Open original article
        </a>
      )}

      <Button
        type="button"
        disabled={!actionable || !values.title || !values.url}
        variant="primary"
        onClick={() => void review(() => onAcceptCandidate(candidate, values))}
      >
        Keep
      </Button>

      <Button
        type="button"
        disabled={!actionable}
        onClick={() =>
          void review(() =>
            onRejectCandidate(candidate, values.rejection_reason),
          )
        }
        className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 font-medium text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Dismiss
      </Button>
    </div>
  );

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Review item</h2>
          <p className="mt-1 text-sm text-slate-400">
            Keeping adds this item to Library. Edit its details or tags first if
            needed.
          </p>
        </div>
        <IngestionCandidateStatusBadge
          status={candidate.deferred ? "later" : candidate.status}
        />
      </div>

      <div className="space-y-4">
        {candidate.rule_result && (
          <details className="text-slate-300">
            <summary>
              Why this item was routed · rules v{candidate.rule_result.version}
            </summary>
            <p>
              Classified{" "}
              {new Date(candidate.rule_result.classifiedAt).toLocaleString()} as{" "}
              {candidate.rule_result.route.replaceAll("_", " ")}.
            </p>
            <ul>
              {candidate.rule_result.matches.map((match, index) => (
                <li key={index}>
                  {match.kind}: “{match.term}” in {match.field}
                  {match.tag
                    ? ` → ${
                        tags.find((tag) => tag.id === match.tag)?.name ??
                        "suggested tag"
                      }`
                    : ""}
                </li>
              ))}
            </ul>
            {candidate.rule_result.matches.length === 0 && (
              <p>No terms matched; inclusion defaults determined the route.</p>
            )}
            {candidate.rule_result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </details>
        )}
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <CandidatePreviewPane key={candidate.id} candidate={candidate} />
        {actionRow}

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title
          </label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Item title"
            placeholder="Title"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
          />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Publisher excerpt (not full article text)
          </p>
          <p className="text-sm leading-6 text-slate-300">{preview}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Metadata
          </p>
          <p className="mb-4 text-sm text-slate-300">
            {sourceName} / {formatDisplayDate(values.published_at)} /{" "}
            {formatImportSource(candidate.import_source)}
          </p>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem]">
            <select
              aria-label="Item source"
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
              aria-label="Published date"
              type="date"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={values.published_at}
              onChange={(event) =>
                updateValue("published_at", event.target.value)
              }
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-medium text-slate-300">
              Tags for this item
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = values.tag_ids.includes(tag.id);

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

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Saved summary / analyst notes
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Saved summary / analyst notes"
            rows={4}
            placeholder="Description / summary"
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
          />
        </div>

        <details className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <summary>Technical details and duplicate action</summary>
          <Button
            type="button"
            disabled={!actionable}
            onClick={() => void review(() => onMarkDuplicate(candidate))}
            className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Duplicate
          </Button>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Technical Details
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-slate-400">URL</label>
              {values.url && (
                <a
                  href={values.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  Open
                </a>
              )}
            </div>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Original URL"
              placeholder="URL"
              value={values.url}
              onChange={(event) => updateValue("url", event.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-slate-400">
                Canonical URL
              </label>
              {values.canonical_url && (
                <a
                  href={values.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  Open
                </a>
              )}
            </div>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Canonical URL"
              placeholder="Canonical URL"
              value={values.canonical_url}
              onChange={(event) =>
                updateValue("canonical_url", event.target.value)
              }
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-slate-400">
                Final URL
              </label>
              {values.final_url && (
                <a
                  href={values.final_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  Open
                </a>
              )}
            </div>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Final URL"
              placeholder="Final URL"
              value={values.final_url}
              onChange={(event) => updateValue("final_url", event.target.value)}
            />
          </div>
        </details>

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
          aria-label="Optional dismissal reason"
          placeholder="Optional dismissal reason"
          value={values.rejection_reason}
          onChange={(event) =>
            updateValue("rejection_reason", event.target.value)
          }
        />

        {actionRow}
      </div>
    </Card>
  );
}
