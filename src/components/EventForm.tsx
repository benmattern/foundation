import { useRef, useState } from "react";
import type { Article } from "../types/article";
import type { FoundationEventWithArticles } from "../types/event";
import { eventStatusOptions, eventTypeOptions } from "../types/event";
import type { TimelineDetail, TimelineValues } from "../types/timeline";
import { validateChronology } from "../lib/timeline";
import { Input, controlClass } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { EventReferencesEditor } from "./EventReferencesEditor";
export type EventFormValues = TimelineValues;
type Props = {
  articles?: Article[];
  mode?: "create" | "edit";
  initialEvent?: FoundationEventWithArticles | TimelineDetail | null;
  onSubmit: (values: TimelineValues, request: string) => Promise<void>;
  onCancel?: () => void;
};
export function EventForm(props: Props) {
  return <EventFormFields key={props.initialEvent?.id ?? "new"} {...props} />;
}
function EventFormFields({ initialEvent, onSubmit, onCancel }: Props) {
  const prior = initialEvent as Partial<TimelineDetail> | undefined;
  const [values, setValues] = useState<TimelineValues>(() => ({
    title: prior?.title ?? "",
    description: prior?.description ?? "",
    event_type: prior?.event_type ?? "",
    status: prior?.status ?? "draft",
    location: prior?.location ?? "",
    date_start:
      prior && "date_start" in prior
        ? (prior.date_start ?? "")
        : (prior?.occurred_at?.slice(0, 10) ?? ""),
    date_end: prior?.date_end ?? "",
    date_approximate: prior?.date_approximate ?? false,
    date_note: prior?.date_note ?? "",
    claim_kind: prior?.claim_kind ?? "unverified",
    analyst_notes: prior?.analyst_notes ?? "",
    references: prior?.references ?? [],
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false),
    request = useRef({ hash: "", id: "" });
  const change = <K extends keyof TimelineValues>(
    key: K,
    value: TimelineValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-700 p-4 sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        setError("");
        try {
          validateChronology(values.date_start, values.date_end);
          const hash = JSON.stringify(values);
          if (request.current.hash !== hash)
            request.current = { hash, id: crypto.randomUUID() };
          await onSubmit(values, request.current.id);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          locked.current = false;
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-semibold">
        {prior ? "Edit event" : "Create event"}
      </h2>
      <Input
        label="Event title"
        placeholder="Event title"
        required
        maxLength={300}
        value={values.title}
        onChange={(e) => change("title", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Event type"
          list="timeline-event-types"
          maxLength={100}
          value={values.event_type}
          onChange={(e) => change("event_type", e.target.value)}
          hint="Choose a category or enter your own."
        />
        <datalist id="timeline-event-types">
          {eventTypeOptions.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </datalist>
        <label>
          Status
          <select
            aria-label="Event status"
            className={controlClass}
            value={values.status}
            onChange={(e) =>
              change("status", e.target.value as TimelineValues["status"])
            }
          >
            {eventStatusOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Input
          label="Occurrence start"
          value={values.date_start}
          onChange={(e) => change("date_start", e.target.value)}
          maxLength={10}
          placeholder="YYYY, YYYY-MM or YYYY-MM-DD"
          hint="Blank means unknown. Publication and collection dates are separate."
        />
        <Input
          label="Occurrence end (optional range)"
          value={values.date_end}
          onChange={(e) => change("date_end", e.target.value)}
          maxLength={10}
          placeholder="YYYY, YYYY-MM or YYYY-MM-DD"
        />
      </div>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={values.date_approximate}
          onChange={(e) => change("date_approximate", e.target.checked)}
        />
        Approximate / uncertain occurrence date
      </label>
      {prior?.date_origin === "legacy_timestamp" && (
        <p className="text-sm text-amber-200">
          Legacy timestamp preserved: {prior.occurred_at}. Changing the date or
          uncertainty makes the calendar dates explicit; the original timestamp
          stays in the record and audit.
        </p>
      )}
      <Textarea
        label="Date uncertainty / basis"
        value={values.date_note}
        maxLength={2000}
        rows={2}
        onChange={(e) => change("date_note", e.target.value)}
      />
      <Input
        label="Location"
        value={values.location}
        maxLength={500}
        onChange={(e) => change("location", e.target.value)}
      />
      <label>
        Account classification
        <select
          aria-label="Account classification"
          className={controlClass}
          value={values.claim_kind}
          onChange={(e) =>
            change("claim_kind", e.target.value as TimelineValues["claim_kind"])
          }
        >
          <option value="unverified">Unverified claim</option>
          <option value="source_reported">Source-reported account</option>
          <option value="analyst_observation">Analyst observation</option>
          <option value="disputed">Disputed account</option>
        </select>
      </label>
      <Textarea
        label="Event description (analyst-entered account)"
        rows={4}
        maxLength={10000}
        value={values.description}
        onChange={(e) => change("description", e.target.value)}
      />
      <Textarea
        label="Analyst interpretation / notes"
        rows={3}
        maxLength={10000}
        value={values.analyst_notes}
        onChange={(e) => change("analyst_notes", e.target.value)}
        hint="Analyst reasoning is separate from publisher text."
      />
      <EventReferencesEditor
        references={values.references}
        onChange={(value) => change("references", value)}
      />
      {error && (
        <p role="alert" className="text-red-300">
          {error} Your draft is preserved. For stale revisions, reload the event
          before deliberately reapplying edits.
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy} variant="primary">
          {prior ? "Save event" : "Create event"}
        </Button>
        {onCancel && (
          <Button disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
