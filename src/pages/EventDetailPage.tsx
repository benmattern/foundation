import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { EventForm } from "../components/EventForm";
import { Button } from "../components/ui/Button";
import {
  getTimelineEvent,
  removeTimelineEvent,
  saveTimelineEvent,
} from "../services/timelineService";
import { eventDateLabel, timelineReturnPath } from "../lib/timeline";
import type { EventReference, TimelineDetail } from "../types/timeline";
export default function EventDetailPage() {
  const { id } = useParams();
  return <EventDetail key={id} id={id!} />;
}
function EventDetail({ id }: { id: string }) {
  const [event, setEvent] = useState<TimelineDetail | null>(null),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  const navigate = useNavigate(),
    [params] = useSearchParams();
  const back = timelineReturnPath(params.get("returnTo"));
  const self = `/events/${id}?returnTo=${encodeURIComponent(back)}`;
  const deletion = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    getTimelineEvent(id)
      .then((result) => {
        if (active) {
          setEvent(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <section className="space-y-5">
      <Link to={back} className="text-blue-300 underline">
        Back to timeline
      </Link>
      {error && (
        <p role="alert" className="text-red-300">
          {error}{" "}
          <Button onClick={() => setAttempt((v) => v + 1)}>Reload event</Button>
        </p>
      )}
      {!event && !error && <p role="status">Loading event…</p>}
      {event && (
        <>
          <PageHeader
            title={event.title}
            description="Analyst-defined event record and attributed evidence"
          />
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => setEditing(!editing)}>
              {editing ? "Close editor" : "Edit event"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${event.title}"? Linked articles, entities and questions are preserved; event history remains. This cannot be undone.`,
                  )
                ) {
                  setBusy(true);
                  setError("");
                  void removeTimelineEvent(event, deletion.current)
                    .then(() => navigate(back))
                    .catch((e) => setError(String(e)))
                    .finally(() => setBusy(false));
                }
              }}
            >
              Delete event
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setAttempt((v) => v + 1);
              }}
            >
              Reload event
            </Button>
          </div>
          {editing ? (
            <EventForm
              key={event.version}
              mode="edit"
              initialEvent={event}
              onCancel={() => setEditing(false)}
              onSubmit={async (values, request) => {
                setBusy(true);
                try {
                  await saveTimelineEvent(values, request, event);
                  const latest = await getTimelineEvent(id);
                  setEvent(latest);
                  setEditing(false);
                  setError("");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <>
              <section
                className="space-y-3 rounded-xl border border-slate-700 p-4"
                aria-label="Event account"
              >
                <h2 className="text-xl">Occurrence</h2>
                <p className="break-words text-blue-200">
                  {eventDateLabel(event)}
                </p>
                <p className="break-words whitespace-pre-wrap text-amber-200">
                  {event.date_note ||
                    "No date basis or uncertainty note recorded."}
                </p>
                <p>
                  {event.event_type || "Unclassified"} · {event.status} ·{" "}
                  {event.claim_kind.replaceAll("_", " ")}
                </p>
                {event.location && (
                  <p className="break-words">Location: {event.location}</p>
                )}
                <h3 className="font-semibold">
                  Event description (analyst-entered account)
                </h3>
                <p className="break-words whitespace-pre-wrap">
                  {event.description || "No account recorded."}
                </p>
                <h3 className="font-semibold">
                  Analyst interpretation / notes
                </h3>
                <p className="break-words whitespace-pre-wrap text-slate-300">
                  {event.analyst_notes ||
                    "No separate interpretation recorded."}
                </p>
                <p className="text-sm text-slate-400">
                  Analyst record created: {event.created_at} · updated:{" "}
                  {event.updated_at} · revision {event.version}
                </p>
                {event.occurred_at && (
                  <p className="break-words text-sm text-slate-400">
                    Original occurrence timestamp: {event.occurred_at}. This is
                    not publication, collection or record creation time.
                  </p>
                )}
              </section>
              <section className="space-y-3" aria-label="Event evidence">
                <h2 className="text-xl">Evidence and associated research</h2>
                <p className="text-sm text-slate-400">
                  Frozen attribution describes the record when linked, not a
                  frozen article body. Supporting and challenging labels are
                  analyst decisions; repeated reporting is not independent
                  corroboration.
                </p>
                {!event.references.length && (
                  <p>
                    No evidence or research associations yet. Edit this event to
                    add records.
                  </p>
                )}
                {event.references.map((r) => (
                  <ReferenceCard
                    key={`${r.kind}:${r.target_id}`}
                    reference={r}
                    returnTo={self}
                  />
                ))}
              </section>
            </>
          )}
          <details>
            <summary>Event edit history (latest 20)</summary>
            <div className="space-y-3 pt-3">
              {event.history.map((h) => (
                <div className="rounded border border-slate-700 p-3" key={h.id}>
                  <p className="text-sm">Analyst change: {h.recorded_at}</p>
                  <details>
                    <summary>
                      Before and after record / reference snapshots
                    </summary>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">
                      {JSON.stringify(
                        { before: h.before_state, after: h.after_state },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </div>
              ))}
              {!event.history.length && (
                <p>
                  No timeline edits recorded; earlier event history was not
                  reconstructed.
                </p>
              )}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
function ReferenceCard({
  reference: r,
  returnTo,
}: {
  reference: EventReference;
  returnTo: string;
}) {
  const target =
    r.kind === "article"
      ? `/articles/${r.target_id}`
      : r.kind === "question"
        ? `/research?question=${r.target_id}`
        : `/entities?entity=${r.target_id}`;
  return (
    <article className="space-y-2 rounded-xl border border-slate-700 p-4">
      <h3 className="break-words font-semibold">{r.snapshot.title}</h3>
      <p className="text-sm text-slate-400">
        {r.kind} · {r.disposition}
        {r.available === false ? " · unavailable; retained reference" : ""}
      </p>
      {r.kind === "article" && (
        <>
          <p className="break-words">
            Publisher: {r.snapshot.source_name || "Unknown publisher"}
          </p>
          <p className="break-words text-sm text-slate-400">
            Published: {r.snapshot.published_at || "Unknown"} · FOUNDATION
            collected: {r.snapshot.collected_at || "Unknown"} · project
            approval/capture: {r.snapshot.approved_at || "Unknown"}
          </p>
          {r.snapshot.item_id && (
            <p className="break-all text-xs text-slate-500">
              Acquisition identity: {r.snapshot.item_id} (repeated identity is
              not independent reporting)
            </p>
          )}
        </>
      )}
      <p className="break-words whitespace-pre-wrap text-slate-300">
        {r.note || "No separate association note."}
      </p>
      {r.available !== false && (
        <Link
          className="inline-block py-2 text-blue-300 underline"
          to={`${target}${target.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`}
        >
          Open {r.kind} record
        </Link>
      )}
      {r.kind === "article" && /^https?:\/\//.test(r.snapshot.url ?? "") && (
        <a
          className="ml-4 inline-block py-2 text-blue-300 underline"
          href={r.snapshot.url}
          target="_blank"
          rel="noreferrer"
        >
          Original source URL
        </a>
      )}
    </article>
  );
}
