import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { IngestionCandidateList } from "../components/IngestionCandidateList";
import {
  IngestionCandidateReview,
  type IngestionCandidateReviewValues,
} from "../components/IngestionCandidateReview";
import { getSources } from "../services/sourceService";
import { getTags } from "../services/tagService";
import {
  bulkReview,
  type CandidateQuery,
  getBulkHistory,
  queryCandidates,
  reviewCandidate,
} from "../services/ingestionCandidateService";
import { CandidateHistory } from "../components/CandidateHistory";
import { activeProjectId } from "../services/projectService";
import { selectVisibleCandidate } from "../lib/ingestionQueue";
import type {
  IngestionCandidate,
  IngestionCandidateStatus,
  IngestionImportSource,
} from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";

const statuses: IngestionCandidateStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "duplicate",
];
type Result = {
  key: string;
  candidates: IngestionCandidate[];
  count: number;
  counts: Record<IngestionCandidateStatus, number>;
};
export default function IngestionQueuePage() {
  const [params, setParams] = useSearchParams(
    sessionStorage.getItem(`foundation.queue.${activeProjectId()}`) ?? "",
  );
  const status =
    statuses.includes(params.get("status") as IngestionCandidateStatus)
      ? params.get("status") as IngestionCandidateStatus
      : "pending";
  const filters: CandidateQuery = {
    status,
    route: status === "pending" ? params.get("route") ?? "pending" : undefined,
    search: params.get("q") ?? "",
    source: params.get("source") ?? "all",
    importSource: params.get("import") ?? "all",
    tag: params.get("tag") ?? "",
    since: params.get("since") ?? "",
    until: params.get("until") ?? "",
    page: Math.max(0, Number(params.get("page")) || 0),
  };
  const queryKey = JSON.stringify(filters);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({
    key: "",
    ids: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [bulkTag, setBulkTag] = useState("");
  const [bulkHistory, setBulkHistory] = useState<
    Awaited<ReturnType<typeof getBulkHistory>>
  >([]);
  useEffect(() => {
    sessionStorage.setItem(
      `foundation.queue.${activeProjectId()}`,
      params.toString(),
    );
  }, [params]);
  useEffect(() => {
    let active = true;
    getBulkHistory().then((history) => {
      if (active) setBulkHistory(history);
    }).catch((error) => {
      if (active) setError(String(error));
    });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    let active = true;
    getSources().then((data) => {
      if (active) setSources(data);
    }).catch((error) => {
      if (active) setError(String(error));
    });
    getTags().then((data) => {
      if (active) setTags(data);
    }).catch((error) => {
      if (active) setError(String(error));
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const snapshot = JSON.parse(queryKey) as CandidateQuery;
    const timer = setTimeout(() => {
      void Promise.all([
        queryCandidates(snapshot),
        ...statuses.map((status) =>
          queryCandidates({ ...snapshot, status, route: undefined, page: 0 })
        ),
      ])
        .then(([page, ...counts]) => {
          if (!active) return;
          setResult({
            key: queryKey,
            ...page,
            counts: Object.fromEntries(
              statuses.map((status, i) => [status, counts[i].count]),
            ) as Result["counts"],
          });
          setError("");
        }).catch((error: unknown) => {
          if (active) setError(String(error));
        });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryKey, revision]);
  const visible = result?.key === queryKey ? result.candidates : [];
  const candidate = selectVisibleCandidate(visible, selectedId);
  const selected = selection.key === queryKey
    ? selection.ids.filter((id) => visible.some((c) => c.id === id))
    : [];
  function change(key: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set(key, value);
      if (key !== "page") next.delete("page");
      return next;
    });
    setSelectedId(null);
    setSelection({ key: "", ids: [] });
  }
  async function act(
    candidate: IngestionCandidate,
    action: string,
    values: Record<string, unknown> = {},
  ) {
    await reviewCandidate(candidate.id, action, values);
    setRevision((n) => n + 1);
  }
  async function bulk(action: string) {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setOutcomes([]);
    try {
      const results = await bulkReview(selected, action, bulkTag || null);
      setOutcomes(
        results.map((r) =>
          `${visible.find((c) => c.id === r.id)?.title || r.id}: ${
            r.ok ? `${action} completed` : r.error
          }`
        ),
      );
      setSelection({
        key: queryKey,
        ids: results.filter((r) => !r.ok).map((r) => r.id),
      });
      setRevision((n) => n + 1);
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }
  const count = result?.key === queryKey ? result.count : 0;
  return (
    <>
      <PageHeader
        title="Ingestion"
        description="Review project intake. Collection and rules work without AI."
      />
      {error && <p role="alert" className="p-3 text-red-300">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-slate-300">
        {status === "pending" && (
          <label>
            Route{" "}
            <select
              aria-label="Route"
              className="bg-slate-800 p-2"
              value={filters.route}
              onChange={(e) => change("route", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="outside_scope">Outside scope</option>
            </select>
          </label>
        )}
        <label>
          Tag{" "}
          <select
            aria-label="Tag filter"
            className="bg-slate-800 p-2"
            value={filters.tag}
            onChange={(e) => change("tag", e.target.value)}
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </label>
        <label>
          Collected from{" "}
          <input
            aria-label="Collected from"
            type="date"
            className="bg-slate-800 p-2"
            value={filters.since}
            onChange={(e) => change("since", e.target.value)}
          />
        </label>
        <label>
          Through{" "}
          <input
            aria-label="Collected through"
            type="date"
            className="bg-slate-800 p-2"
            value={filters.until}
            onChange={(e) => change("until", e.target.value)}
          />
        </label>
        <button
          disabled={filters.page === 0}
          onClick={() => change("page", String(filters.page - 1))}
        >
          Previous
        </button>
        <span>Page {filters.page + 1} · {count} matching items</span>
        <button
          disabled={(filters.page + 1) * 50 >= count}
          onClick={() => change("page", String(filters.page + 1))}
        >
          Next
        </button>
      </div>
      <div className="mb-4 space-y-3 rounded border border-slate-700 p-4 text-slate-300">
        <label>
          <input
            type="checkbox"
            checked={visible.length > 0 && selected.length === visible.length}
            disabled={busy}
            onChange={(e) =>
              setSelection({
                key: queryKey,
                ids: e.target.checked ? visible.map((c) => c.id) : [],
              })}
          />{" "}
          Select this page only ({visible.length} visible)
        </label>
        <p>{selected.length} selected on this page</p>
        <div className="flex flex-wrap gap-3">
          {[
            "accept",
            "reject",
            "duplicate",
            "restore",
            "outside_scope",
            "pending",
          ].map((action) => (
            <button
              key={action}
              disabled={busy || selected.length === 0}
              onClick={() => void bulk(action)}
            >
              {action.replaceAll("_", " ")}
            </button>
          ))}
          <select
            aria-label="Bulk tag"
            className="bg-slate-800 p-2"
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
          >
            <option value="">Choose tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <button
            disabled={busy || !bulkTag || selected.length === 0}
            onClick={() => void bulk("tags")}
          >
            Add tag
          </button>
        </div>
        {visible.map((item) => (
          <label className="mr-4 inline-block" key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              disabled={busy}
              onChange={(e) =>
                setSelection({
                  key: queryKey,
                  ids: e.target.checked
                    ? [...selected, item.id]
                    : selected.filter((id) =>
                      id !== item.id
                    ),
                })}
            />{" "}
            {item.title || item.url}
          </label>
        ))}
        {outcomes.length > 0 && (
          <ul aria-live="polite">
            {outcomes.map((message, i) => <li key={i}>{message}</li>)}
          </ul>
        )}
        <details>
          <summary>Recent bulk results</summary>
          {bulkHistory.map((run) => (
            <p key={run.id}>
              {new Date(run.created_at).toLocaleString()} · {run.action} ·{" "}
              {run.results.filter((r) => r.ok).length} succeeded /{" "}
              {run.results.filter((r) => !r.ok).length} failed
            </p>
          ))}
        </details>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <IngestionCandidateList
          candidates={visible}
          sources={sources}
          selectedStatus={status}
          statusCounts={result?.counts ??
            { pending: 0, accepted: 0, rejected: 0, duplicate: 0 }}
          searchQuery={filters.search ?? ""}
          selectedSourceFilter={filters.source ?? "all"}
          selectedImportSourceFilter={(filters.importSource ?? "all") as
            | "all"
            | IngestionImportSource}
          hasActiveFilters={params.size > 0}
          selectedCandidateId={candidate?.id}
          onSelectStatus={(status) => change("status", status)}
          onSearchQueryChange={(value) => change("q", value)}
          onSourceFilterChange={(value) => change("source", value)}
          onImportSourceFilterChange={(value) => change("import", value)}
          onClearFilters={() => setParams({})}
          onSelectCandidate={(item) => setSelectedId(item.id)}
        />
        <div>
          {candidate && (
            <CandidateHistory key={candidate.id} candidate={candidate} />
          )}
          {candidate && candidate.status !== "accepted" &&
            (candidate.status !== "pending" ||
              candidate.route === "outside_scope") &&
            (
              <button
                className="mb-3 text-blue-300"
                onClick={() =>
                  void act(candidate, "restore").catch((error) =>
                    setError(String(error))
                  )}
              >
                Restore to pending
              </button>
            )}
          <IngestionCandidateReview
            candidate={candidate}
            sources={sources}
            tags={tags}
            onSaveCandidate={(item, values) => act(item, "save", values)}
            onAcceptCandidate={(item, values: IngestionCandidateReviewValues) =>
              act(item, "accept", values)}
            onRejectCandidate={(item, reason) =>
              act(item, "reject", { rejection_reason: reason })}
            onMarkDuplicate={(item) => act(item, "duplicate")}
          />
        </div>
      </div>
    </>
  );
}
