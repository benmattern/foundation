import { useState } from "react";
import type {
  ReferenceKind,
  TimelineFilters as Filters,
} from "../types/timeline";
import { TimelineReferenceSearch } from "./TimelineReferenceSearch";
import { Input, controlClass } from "./ui/Input";
import { Button } from "./ui/Button";
export function TimelineFilters({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (value: Filters) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [picker, setPicker] = useState<ReferenceKind | "source" | "">("");
  return (
    <section
      className="space-y-3 rounded-xl border border-slate-700 p-4"
      aria-label="Timeline filters"
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onChange(draft);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Search events"
            type="search"
            maxLength={200}
            value={draft.search}
            onChange={(e) => setDraft({ ...draft, search: e.target.value })}
          />
          <Input
            label="Occurrence from"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
          <Input
            label="Occurrence through"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
          <Input
            label="Filter event type"
            value={draft.type}
            maxLength={100}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          />
        </div>
        <label>
          Chronological order
          <select
            aria-label="Chronological order"
            className={controlClass}
            value={draft.order}
            onChange={(e) =>
              setDraft({ ...draft, order: e.target.value as Filters["order"] })
            }
          >
            <option value="asc">Oldest first</option>
            <option value="desc">Newest first</option>
          </select>
        </label>
        <Button type="submit" variant="primary">
          Apply filters
        </Button>
      </form>
      <p className="text-sm text-slate-400">
        Date filters include overlapping ranges and the whole entered
        month/year. Undated events are excluded by date filters, otherwise shown
        last. Approximate means uncertain, not an inferred interval.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["article", "entity", "question", "source"] as const).map((kind) => (
          <Button
            key={kind}
            onClick={() => setPicker(picker === kind ? "" : kind)}
          >
            Filter by {kind}
            {value[kind] ? " · selected" : ""}
          </Button>
        ))}
      </div>
      {picker && (
        <TimelineReferenceSearch
          key={picker}
          kind={picker}
          label={`Filter by ${picker} search`}
          onSelect={(option) => {
            onChange({ ...draft, [picker]: option.id });
            setPicker("");
          }}
        />
      )}
      {(["article", "entity", "question", "source"] as const)
        .filter((kind) => value[kind])
        .map((kind) => (
          <p className="break-all text-sm" key={kind}>
            Selected {kind}: {value[kind]}{" "}
            <Button onClick={() => onChange({ ...value, [kind]: "" })}>
              Clear {kind} filter
            </Button>
          </p>
        ))}
    </section>
  );
}
