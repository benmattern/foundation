import { useState } from "react";
import type { EventReference, ReferenceKind } from "../types/timeline";
import { TimelineReferenceSearch } from "./TimelineReferenceSearch";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { controlClass } from "./ui/Input";
export function EventReferencesEditor({
  references,
  onChange,
}: {
  references: EventReference[];
  onChange: (value: EventReference[]) => void;
}) {
  const [kind, setKind] = useState<ReferenceKind>("article");
  return (
    <section
      className="space-y-4 rounded-lg border border-slate-700 p-4"
      aria-label="Event associations"
    >
      <h3 className="text-lg">Evidence and research associations</h3>
      <p className="text-sm text-slate-400">
        Explicit analyst associations. Mentioning the same event does not
        establish independent confirmation. Suggested entity mentions are never
        added automatically.
      </p>
      <label>
        Record kind
        <select
          aria-label="Record kind"
          className={controlClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as ReferenceKind)}
        >
          <option value="article">Articles</option>
          <option value="entity">Entities</option>
          <option value="question">Research questions</option>
        </select>
      </label>
      <TimelineReferenceSearch
        key={kind}
        kind={kind}
        onSelect={(option) => {
          if (
            references.length < 200 &&
            !references.some(
              (r) => r.kind === kind && r.target_id === option.id,
            )
          )
            onChange([
              ...references,
              {
                kind,
                target_id: option.id,
                disposition: "context",
                note: "",
                snapshot: { id: option.id, title: option.label },
                available: true,
              },
            ]);
        }}
      />
      <p className="text-sm">{references.length} / 200 selected references</p>
      {references.map((r, index) => (
        <div
          className="space-y-2 rounded border border-slate-700 p-3"
          key={`${r.kind}:${r.target_id}`}
        >
          <p className="break-words font-medium">
            {r.kind}: {r.snapshot.title}
            {r.available === false ? " · unavailable; snapshot retained" : ""}
          </p>
          {r.kind === "article" && (
            <label>
              Evidence role
              <select
                aria-label={`Evidence role for ${r.snapshot.title}`}
                className={controlClass}
                value={r.disposition}
                onChange={(e) =>
                  onChange(
                    references.map((ref, i) =>
                      i === index
                        ? {
                            ...ref,
                            disposition: e.target
                              .value as EventReference["disposition"],
                          }
                        : ref,
                    ),
                  )
                }
              >
                <option value="context">Context / mentions event</option>
                <option value="supports">Supports the account</option>
                <option value="challenges">Challenges the account</option>
              </select>
            </label>
          )}
          <Textarea
            label={`Association note for ${r.snapshot.title}`}
            rows={2}
            maxLength={4000}
            value={r.note}
            onChange={(e) =>
              onChange(
                references.map((ref, i) =>
                  i === index ? { ...ref, note: e.target.value } : ref,
                ),
              )
            }
          />
          <Button
            onClick={() => onChange(references.filter((_, i) => i !== index))}
          >
            Remove {r.snapshot.title}
          </Button>
        </div>
      ))}
    </section>
  );
}
