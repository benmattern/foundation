import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCatalogSelections,
  type CatalogSelection,
} from "../services/coverageService";
import { sourceCatalog, verificationStale } from "../lib/sourceCatalog";
import { IntakeCalibration } from "./IntakeCalibration";
import type { Source } from "../types/source";
import type { RssFeed } from "../types/rssFeed";
import type { Subscription } from "../types/project";
import type { ProjectSourceState } from "../services/projectService";
import type { CollectionRun } from "../services/rssFeedService";
export function SourceCoverage({
  sources,
  feeds,
  subscriptions,
  states,
  runs,
}: {
  sources: Source[];
  feeds: RssFeed[];
  subscriptions: Subscription[];
  states: ProjectSourceState[];
  runs: CollectionRun[];
}) {
  const [selected, setSelected] = useState<CatalogSelection[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getCatalogSelections()
      .then((s) => {
        if (active) setSelected(s);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, []);
  const topics = [...new Set(selected.flatMap((s) => s.topics))];
  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <h2 className="text-2xl">Selected official-source coverage</h2>
        <p>
          Topics/regions below are the catalog labels you selected when adding
          each source, not inferred coverage. Sources outside these selections
          have unknown pack coverage. Counts describe configured publisher
          records and availability, not completeness or independent
          corroboration.
        </p>
        {error && <p role="alert">{error}</p>}
        {!selected.length && (
          <p>
            No pack selections recorded. Existing sources remain usable. Preview
            Discover and select only useful publishers.
          </p>
        )}
        {topics.map((t) => {
          const ids = new Set(
            selected
              .filter((s) => s.topics.includes(t))
              .map((s) => s.source_id),
          );
          return (
            <p key={t}>
              {t}: {ids.size} selected publisher record(s)
              {ids.size === 1 ? " — only one configured origin" : ""}.
            </p>
          );
        })}
        {selected.map((s) => {
          const entry = sourceCatalog.find((c) => c.id === s.catalog_id),
            fs = feeds.filter((f) => f.source_id === s.source_id),
            state = states.find((p) => p.source_id === s.source_id)?.state,
            ss = fs.flatMap((f) =>
              subscriptions.filter((p) => p.feed_id === f.id),
            ),
            enabled = ss.some((p) => p.enabled && p.followed !== false),
            status =
              state === "unfollowed"
                ? "unfollowed"
                : state === "paused"
                  ? "paused"
                  : enabled
                    ? "enabled"
                    : fs.length
                      ? "paused / not enabled"
                      : "manual-only";
          return (
            <article
              key={s.catalog_id}
              className="space-y-2 rounded-xl border border-slate-700 p-4"
            >
              <h3 className="text-xl">
                <Link to={`/sources/${s.source_id}`}>
                  {sources.find((p) => p.id === s.source_id)?.name ??
                    "Source unavailable"}
                </Link>{" "}
                — {status}
              </h3>
              <p>
                Selected topics: {s.topics.join(", ") || "unknown"}; region:{" "}
                {s.region || "unknown"}. Available fields at verification:{" "}
                {entry?.fields.join(", ") ?? "unknown"}.
              </p>
              <p>
                {entry
                  ? `Verified ${entry.verifiedOn}${verificationStale(entry.verifiedOn) ? " — stale verification" : ""}. ${entry.limits}`
                  : "Catalog entry unavailable; saved source retained."}
              </p>
              {fs.map((f) => (
                <p key={f.id}>
                  Last attempt: {f.last_checked_at ?? "never"}; last success:{" "}
                  {f.last_success_at ?? "never"}; consecutive failures:{" "}
                  {f.failure_count ?? 0}; shared availability:{" "}
                  {f.is_active ? "active" : "disabled"}. Latest visible run
                  error (recent 50 shared runs):{" "}
                  {runs.find((r) => r.feed_id === f.id)?.error ??
                    "none recorded in this bounded sample"}
                  .{" "}
                  {!f.last_success_at ||
                  Date.now() - Date.parse(f.last_success_at) > 7 * 86400000
                    ? "No success in the last seven days."
                    : ""}{" "}
                  <Link
                    className="text-blue-300"
                    to={`/sources/${s.source_id}`}
                  >
                    Inspect health / errors and manage following
                  </Link>
                </p>
              ))}
            </article>
          );
        })}
        <p>
          Unselected publishers, languages, topics and unobserved events remain
          coverage gaps. One broad feed does not establish subject completeness.
          Manual sources do not imply automatic intake.
        </p>
      </section>
      <IntakeCalibration sources={sources} />
    </div>
  );
}
