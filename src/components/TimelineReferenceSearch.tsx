import { useEffect, useState } from "react";
import { getTimelineOptions } from "../services/timelineService";
import type { ReferenceKind, TimelineOption } from "../types/timeline";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
export function TimelineReferenceSearch({
  kind,
  onSelect,
  label = `Find ${kind}`,
}: {
  kind: ReferenceKind | "source";
  onSelect: (option: TimelineOption) => void;
  label?: string;
}) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<TimelineOption[]>([]);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      getTimelineOptions(kind, search, offset)
        .then((result) => {
          if (active) {
            setOptions(result.items);
            setMore(result.has_more);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(String(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kind, search, offset, attempt]);
  return (
    <section className="space-y-2" aria-label={label}>
      <Input
        label={label}
        type="search"
        maxLength={200}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOffset(0);
        }}
        hint="Searches authorized records, 25 per page."
      />
      {loading ? (
        <p role="status">Finding records…</p>
      ) : error ? (
        <p role="alert">
          {error}{" "}
          <Button onClick={() => setAttempt((v) => v + 1)}>Retry search</Button>
        </p>
      ) : (
        <>
          <div className="max-h-56 space-y-1 overflow-auto">
            {options.map((option) => (
              <Button
                className="w-full justify-start text-left break-words whitespace-normal"
                key={option.id}
                onClick={() => onSelect(option)}
              >
                {option.label}
                {option.detail ? ` · ${option.detail}` : ""}
              </Button>
            ))}
            {!options.length && (
              <p className="text-sm text-slate-400">
                No matching {kind} records.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={offset === 0}
              onClick={() => setOffset((v) => v - 25)}
            >
              Previous choices
            </Button>
            <Button disabled={!more} onClick={() => setOffset((v) => v + 25)}>
              More choices
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
