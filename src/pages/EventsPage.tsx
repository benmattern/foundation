import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { EventForm } from "../components/EventForm";
import { TimelineFilters } from "../components/TimelineFilters";
import { ResearchTimeline } from "../components/ResearchTimeline";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { emptyTimelineFilters, readTimelineFilters } from "../lib/timeline";
import {
  getTimelinePage,
  saveTimelineEvent,
} from "../services/timelineService";
import type { TimelinePage } from "../types/timeline";
export default function EventsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<TimelinePage | null>(null),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [saving, setSaving] = useState(false),
    [attempt, setAttempt] = useState(0);
  const navigate = useNavigate(),
    query = params.toString();
  const page = Math.max(
    0,
    Math.min(20000, Math.floor(Number(params.get("page")) || 0)),
  );
  const returnTo = `/events${query ? `?${query}` : ""}`;
  useEffect(() => {
    let active = true;
    getTimelinePage(readTimelineFilters(new URLSearchParams(query)), page * 50)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [query, page, attempt]);
  function change(next: URLSearchParams) {
    setData(null);
    setError("");
    setParams(next);
  }
  return (
    <section className="space-y-6">
      <PageHeader
        title="Research timeline"
        description="What happened, when it happened and which evidence informs the account. Occurrence dates are separate from publication, collection and analyst edits."
      />
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setCreating(true)}>
          Create event
        </Button>
        <Button
          onClick={() => {
            setData(null);
            setAttempt((v) => v + 1);
          }}
        >
          Refresh timeline
        </Button>
        <Button onClick={() => change(new URLSearchParams())}>
          Clear all filters
        </Button>
      </div>
      <TimelineFilters
        key={query}
        value={readTimelineFilters(params)}
        onChange={(filters) =>
          change(
            new URLSearchParams(
              Object.entries(filters).filter(
                ([key, value]) =>
                  value !==
                  emptyTimelineFilters[
                    key as keyof typeof emptyTimelineFilters
                  ],
              ),
            ),
          )
        }
      />
      {error && (
        <p role="alert" className="text-red-300">
          {error}{" "}
          <Button onClick={() => setAttempt((v) => v + 1)}>
            Retry timeline
          </Button>
        </p>
      )}
      {!data && !error && <p role="status">Loading timeline…</p>}
      {data && (
        <>
          <p role="status">
            {data.matched} matching events · {data.total} project events · page{" "}
            {page + 1} (up to 50 records)
          </p>
          {!data.items.length ? (
            <EmptyState
              title={
                data.total === 0
                  ? "No project events yet"
                  : "No events match these filters"
              }
            >
              {data.total === 0
                ? "Create a dated or undated event and explicitly connect research evidence."
                : "Adjust dates or associations, clear filters, or return to the first page. Missing references never broaden a filter."}
            </EmptyState>
          ) : (
            <ResearchTimeline events={data.items} returnTo={returnTo} />
          )}
          <div className="flex gap-3">
            <Button
              disabled={page === 0}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page - 1));
                change(next);
              }}
            >
              Previous events
            </Button>
            <Button
              disabled={!data.has_more}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page + 1));
                change(next);
              }}
            >
              Next events
            </Button>
          </div>
        </>
      )}
      {creating && (
        <Dialog
          title="New timeline event"
          busy={saving}
          onClose={() => setCreating(false)}
        >
          <EventForm
            onCancel={() => setCreating(false)}
            onSubmit={async (values, request) => {
              setSaving(true);
              try {
                const saved = await saveTimelineEvent(values, request);
                setCreating(false);
                navigate(
                  `/events/${saved.id}?returnTo=${encodeURIComponent(returnTo)}`,
                );
              } finally {
                setSaving(false);
              }
            }}
          />
        </Dialog>
      )}
      <p className="text-sm text-slate-400">
        Associations are analyst choices, not inferred causal relationships or
        independent corroboration. Browser-local Data Workspace artifacts are
        not durable event citations.
      </p>
    </section>
  );
}
