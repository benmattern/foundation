import { useEffect, useState } from "react";
import { getCandidateHistory } from "../services/historyService";
import type { IngestionCandidate } from "../types/ingestionCandidate";
export function CandidateHistory(
  { candidate }: { candidate: IngestionCandidate },
) {
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof getCandidateHistory>> | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getCandidateHistory(candidate.id, candidate.item_id).then((history) => {
      if (active) setHistory(history);
    }).catch((error) => {
      if (active) setError(String(error));
    });
    return () => {
      active = false;
    };
  }, [candidate.id, candidate.item_id]);
  return (
    <details className="mb-4 text-slate-300">
      <summary>Acquisition origins and review history</summary>
      {error && <p role="alert">{error}</p>}
      <div className="max-h-96 space-y-3 overflow-auto text-sm">
        <p>Recent history, up to 50 entries per section.</p>
        <h3>Feed origins</h3>
        <ul>
          {history?.origins?.map((origin) => (
            <li key={`${origin.feed_id}:${origin.origin_key}`}>
              {origin.observation.title || origin.observation.link} ·{" "}
              {origin.origin_key.startsWith("id:")
                ? "Publisher item identifier"
                : "Article URL identity"}:{" "}
              {origin.origin_key.replace(/^(id|url):/, "")} · Last observed{" "}
              {new Date(origin.observed_at).toLocaleString()}
            </li>
          ))}
        </ul>
        <h3>Review changes in this project</h3>
        <ul>
          {history?.review?.map((entry) => (
            <li key={entry.id}>
              {new Date(entry.reviewed_at).toLocaleString()} ·{" "}
              {entry.before_state?.status ?? "Collected"} →{" "}
              {entry.after_state.status} ·{" "}
              {entry.after_state.route.replaceAll("_", " ")} ·{" "}
              {entry.after_state.title}
            </li>
          ))}
        </ul>
        <h3>Rule evaluations</h3>
        <ul>
          {history?.ruleEvaluations?.map((entry) => (
            <li key={entry.id}>
              Version {entry.result.version} ·{" "}
              {entry.result.route.replaceAll("_", " ")} ·{" "}
              {new Date(entry.evaluated_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
