import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { EmptyState } from "../components/ui/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { WorkingViews } from "../components/WorkingViews";
import { resolveView } from "../lib/workingViews";
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
  "later",
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
  const status = statuses.includes(
    params.get("status") as IngestionCandidateStatus,
  )
    ? (params.get("status") as IngestionCandidateStatus)
    : "pending";
  const filters: CandidateQuery = {
    status,
    order: (params.get("order") ?? "newest") as CandidateQuery["order"],
    route:
      status === "pending" ? (params.get("route") ?? "pending") : undefined,
    search: params.get("q") ?? "",
    source: params.get("source") ?? "all",
    importSource: params.get("import") ?? "all",
    tag: params.get("tag") ?? "",
    since: resolveView(Object.fromEntries(params)).get("since") ?? "",
    until: params.get("until") ?? "",
    page: Math.max(0, Number(params.get("page")) || 0),
  };
  const queryKey = JSON.stringify(filters);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false),
    [tagsLoaded, setTagsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({
    key: "",
    ids: [],
  });
  const [error, setError] = useState("");
  const [keptArticle, setKeptArticle] = useState<string | null>(null);
  const [intake, setIntake] = useState<{
    pending: number;
    outside: number;
    reviewed: number;
  } | null>(null);
  const [shortcuts, setShortcuts] = useState(false);
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
    getBulkHistory()
      .then((history) => {
        if (active) setBulkHistory(history);
      })
      .catch((error) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    let active = true;
    getSources()
      .then((data) => {
        if (active) {
          setSources(data);
          setSourcesLoaded(true);
        }
      })
      .catch((error) => {
        if (active) setError(String(error));
      });
    getTags()
      .then((data) => {
        if (active) {
          setTags(data);
          setTagsLoaded(true);
        }
      })
      .catch((error) => {
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
          queryCandidates({ ...snapshot, status, route: undefined, page: 0 }),
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
        })
        .catch((error: unknown) => {
          if (active) setError(String(error));
        });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryKey, revision]);
  useEffect(() => {
    let active = true;
    Promise.all([
      queryCandidates({ status: "pending", route: "pending", page: 0 }),
      queryCandidates({ status: "pending", route: "outside_scope", page: 0 }),
      ...["accepted", "rejected", "duplicate", "later"].map((status) =>
        queryCandidates({ status, page: 0 }),
      ),
    ])
      .then(([pending, outside, ...reviewed]) => {
        if (active)
          setIntake({
            pending: pending.count,
            outside: outside.count,
            reviewed: reviewed.reduce((n, value) => n + value.count, 0),
          });
      })
      .catch((error: unknown) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const visible = useMemo(
    () => (result?.key === queryKey ? result.candidates : []),
    [result, queryKey],
  );
  const candidate = selectVisibleCandidate(visible, selectedId);
  const selected =
    selection.key === queryKey
      ? selection.ids.filter((id) => visible.some((c) => c.id === id))
      : [];
  useEffect(() => {
    if (!shortcuts) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat ||
        document.querySelector("dialog[open]") ||
        target.closest("input,textarea,select,[contenteditable=true]") ||
        busy
      )
        return;
      const key = event.key.toLowerCase();
      const index = visible.findIndex((c) => c.id === candidate?.id);
      if (key === "n" || key === "p") {
        event.preventDefault();
        setSelectedId(
          visible[
            Math.max(
              0,
              Math.min(visible.length - 1, index + (key === "n" ? 1 : -1)),
            )
          ]?.id ?? null,
        );
      } else if (candidate && ["l", "d"].includes(key)) {
        event.preventDefault();
        setBusy(true);
        void reviewCandidate(candidate.id, key === "l" ? "later" : "reject")
          .then(() => setRevision((n) => n + 1))
          .catch((e) => setError(String(e)))
          .finally(() => setBusy(false));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, candidate, visible, busy]);
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
    const reviewed = await reviewCandidate(candidate.id, action, values);
    if (action === "accept") setKeptArticle(reviewed.converted_article_id);
    setRevision((n) => n + 1);
  }
  async function bulk(action: string) {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setOutcomes([]);
    try {
      const results = await bulkReview(selected, action, bulkTag || null);
      setOutcomes(
        results.map(
          (r) =>
            `${visible.find((c) => c.id === r.id)?.title || r.id}: ${
              r.ok ? `${action} completed` : r.error
            }`,
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
      <WorkingViews surface="ingestion" />
      {((filters.source &&
        filters.source !== "all" &&
        sourcesLoaded &&
        !sources.some((s) => s.id === filters.source)) ||
        (filters.tag &&
          tagsLoaded &&
          !tags.some((t) => t.id === filters.tag))) && (
        <p role="alert">
          A saved source or tag is unavailable. Clear or edit the view; its
          filter has not been broadened.
        </p>
      )}
      <PageHeader
        title="Inbox"
        description="Incoming material awaits your review. Keeping adds it to Library."
      />
      <label className="mb-4 flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={shortcuts}
          onChange={(e) => setShortcuts(e.target.checked)}
        />
        Enable review shortcuts: N/P next/previous, L Later, D Dismiss. Off
        while typing or in dialogs.
      </label>
      {keptArticle && (
        <div
          role="status"
          className="mb-5 space-y-3 rounded-lg border border-emerald-700 p-4"
        >
          <p>Item kept in this project's Library.</p>
          <Link
            className={buttonClass()}
            to={`/articles?article=${encodeURIComponent(keptArticle)}`}
          >
            View in library
          </Link>
        </div>
      )}
      {intake && result?.key === queryKey && result.candidates.length === 0 && (
        <EmptyState
          title={
            params.get("q") ||
            params.get("source") ||
            params.get("tag") ||
            params.get("since") ||
            params.get("until") ||
            params.get("import") ||
            filters.page > 0
              ? "No items match these filters"
              : status !== "pending"
                ? "No items in this review state"
                : intake.outside && !intake.pending
                  ? "No items match your current scope"
                  : intake.reviewed && !intake.pending && !intake.outside
                    ? "All collected items reviewed"
                    : "Nothing collected yet"
          }
          action={
            <>
              <Button onClick={() => setParams({})}>Reset inbox filters</Button>
              <Link className={buttonClass()} to="/sources">
                Choose or check sources
              </Link>
              {intake.outside > 0 && (
                <Link
                  className={buttonClass()}
                  to="/ingestion?route=outside_scope"
                >
                  Review outside-scope items
                </Link>
              )}
            </>
          }
        >
          {intake.outside > 0
            ? "Items outside scope are retained for review. Adjust your matching rules or review those items directly."
            : intake.reviewed > 0
              ? "Your decisions are saved. New incoming items will appear here; kept articles are in Library."
              : "Collection stages items here for your decision. Enable a feed, check source health, or capture a link manually."}
        </EmptyState>
      )}
      {error && (
        <p role="alert" className="p-3 text-red-300">
          {error}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-slate-300">
        <label>
          Order
          <select
            aria-label="Inbox order"
            value={filters.order}
            onChange={(e) => change("order", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="relevance">Relevance (not credibility)</option>
          </select>
        </label>
        <Button
          onClick={() =>
            setSelectedId(
              visible[
                Math.max(
                  0,
                  visible.findIndex((c) => c.id === candidate?.id) - 1,
                )
              ]?.id ?? null,
            )
          }
        >
          Previous item
        </Button>
        <Button
          onClick={() =>
            setSelectedId(
              visible[
                Math.min(
                  visible.length - 1,
                  visible.findIndex((c) => c.id === candidate?.id) + 1,
                )
              ]?.id ?? null,
            )
          }
        >
          Next item
        </Button>
        {status === "pending" && (
          <label>
            Route{" "}
            <select
              aria-label="Route"
              className="bg-slate-800 p-2"
              value={filters.route}
              onChange={(e) => change("route", e.target.value)}
            >
              <option value="pending">Awaiting review</option>
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
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
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
        <Button
          disabled={filters.page === 0}
          onClick={() => change("page", String(filters.page - 1))}
        >
          Previous
        </Button>
        <span>
          Page {filters.page + 1} · {count} matching items
        </span>
        <Button
          disabled={(filters.page + 1) * 50 >= count}
          onClick={() => change("page", String(filters.page + 1))}
        >
          Next
        </Button>
      </div>
      <details className="mb-4 space-y-3 rounded border border-slate-700 p-4 text-slate-300">
        <summary>Bulk review ({selected.length} selected on this page)</summary>
        <label>
          <input
            type="checkbox"
            checked={visible.length > 0 && selected.length === visible.length}
            disabled={busy}
            onChange={(e) =>
              setSelection({
                key: queryKey,
                ids: e.target.checked ? visible.map((c) => c.id) : [],
              })
            }
          />{" "}
          Select this page only ({visible.length} visible)
        </label>
        <p>{selected.length} selected on this page</p>
        <div className="flex flex-wrap gap-3">
          {[
            "later",
            "accept",
            "reject",
            "duplicate",
            "restore",
            "outside_scope",
            "pending",
          ].map((action) => (
            <Button
              key={action}
              disabled={busy || selected.length === 0}
              onClick={() => void bulk(action)}
            >
              {
                {
                  later: "Later",
                  accept: "Keep selected",
                  reject: "Dismiss selected",
                  duplicate: "Duplicate",
                  restore: "Restore",
                  outside_scope: "Move outside scope",
                  pending: "Move to awaiting review",
                }[action]
              }
            </Button>
          ))}
          <select
            aria-label="Bulk tag"
            className="bg-slate-800 p-2"
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
          >
            <option value="">Choose tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <Button
            disabled={busy || !bulkTag || selected.length === 0}
            onClick={() => void bulk("tags")}
          >
            Add tag
          </Button>
        </div>
        {outcomes.length > 0 && (
          <ul aria-live="polite">
            {outcomes.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
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
      </details>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <IngestionCandidateList
          candidates={visible}
          bulkSelected={selected}
          bulkBusy={busy}
          onToggleBulk={(id, checked) =>
            setSelection({
              key: queryKey,
              ids: checked
                ? [...selected, id]
                : selected.filter((value) => value !== id),
            })
          }
          sources={sources}
          selectedStatus={status}
          statusCounts={
            result?.counts ?? {
              later: 0,
              pending: 0,
              accepted: 0,
              rejected: 0,
              duplicate: 0,
            }
          }
          searchQuery={filters.search ?? ""}
          selectedSourceFilter={filters.source ?? "all"}
          selectedImportSourceFilter={
            (filters.importSource ?? "all") as "all" | IngestionImportSource
          }
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
            <CandidateHistory
              key={`${candidate.id}:${revision}`}
              candidate={candidate}
            />
          )}
          {candidate &&
            candidate.status !== "accepted" &&
            (candidate.deferred ||
              candidate.status !== "pending" ||
              candidate.route === "outside_scope") && (
              <Button
                className="mb-3 text-blue-300"
                onClick={() =>
                  void act(candidate, "restore").catch((error) =>
                    setError(String(error)),
                  )
                }
              >
                Restore to inbox
              </Button>
            )}
          <fieldset disabled={busy}>
            <IngestionCandidateReview
              candidate={candidate}
              sources={sources}
              tags={tags}
              onSaveCandidate={(item, values) => act(item, "save", values)}
              onAcceptCandidate={(
                item,
                values: IngestionCandidateReviewValues,
              ) => act(item, "accept", values)}
              onRejectCandidate={(item, reason) =>
                act(item, "reject", { rejection_reason: reason })
              }
              onLaterCandidate={(item) => act(item, "later")}
              onMarkDuplicate={(item) => act(item, "duplicate")}
            />
          </fieldset>
        </div>
      </div>
    </>
  );
}
