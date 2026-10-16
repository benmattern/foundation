import { useEffect, useState } from "react";
import {
  getCandidatePreviews,
  saveCandidatePreview,
  reviewCandidate,
  type CandidatePreview,
} from "../services/ingestionCandidateService";
import { fetchUrlMetadata } from "../services/urlMetadataService";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import { Button } from "./ui/Button";
export function CandidatePreviewPane({
  candidate,
}: {
  candidate: IngestionCandidate;
}) {
  const [previews, setPreviews] = useState<CandidatePreview[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    getCandidatePreviews(candidate.id)
      .then((p) => {
        if (active) setPreviews(p);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [candidate.id]);
  const original = candidate.original_acquisition;
  const excerpt =
    typeof original?.description === "string"
      ? original.description
      : (candidate.description ?? "");
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 p-4">
      <h3 className="font-semibold">
        {original
          ? candidate.import_source === "rss" &&
            typeof candidate.raw_metadata.feed_id === "string"
            ? "Feed-supplied excerpt (not full article)"
            : "Original acquisition excerpt (manual or legacy provenance)"
          : "Legacy summary / unattributed preview"}
      </h3>
      <p className="whitespace-pre-wrap leading-7">
        {excerpt.slice(0, 600) ||
          "No useful excerpt supplied. You can review manually or fetch page metadata on demand."}
      </p>
      {excerpt.length > 600 && (
        <details>
          <summary>
            Expand full available excerpt ({excerpt.length} characters)
          </summary>
          <p className="whitespace-pre-wrap leading-7">{excerpt}</p>
        </details>
      )}
      <p>
        Relevance score:{" "}
        {candidate.relevance_score ?? candidate.rule_result?.score ?? 0} ·{" "}
        {candidate.rule_result?.reason ??
          ((candidate.relevance_score ?? candidate.rule_result?.score ?? 0) > 0
            ? "Matched positive terms; not a truth assessment"
            : "No stored positive signal; not a truth assessment")}
      </p>
      <ul>
        {candidate.rule_result?.matches.map((m, i) => (
          <li key={i}>
            <mark className="bg-blue-900 text-blue-100">{m.term}</mark> in{" "}
            {m.field}: {m.passage ?? "Saved literal match"}
          </li>
        ))}
      </ul>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const data = await fetchUrlMetadata(candidate.url);
            if (!data.description)
              throw Error(
                "No page metadata excerpt is available. Review can continue.",
              );
            const saved = await saveCandidatePreview(
              candidate.id,
              candidate.url,
              data.description,
            );
            setPreviews((p) => [saved, ...p]);
            setMessage(
              "Page metadata saved separately. Original evidence, rules and notes are unchanged.",
            );
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Fetch preview on demand
      </Button>
      {previews.map((p) => (
        <div className="space-y-2 border-t border-slate-700 pt-3" key={p.id}>
          <p>
            Page metadata excerpt ·{" "}
            <a
              className="text-blue-300"
              href={p.origin_url}
              target="_blank"
              rel="noreferrer"
            >
              origin
            </a>{" "}
            · retrieved {new Date(p.retrieved_at).toLocaleString()}
          </p>
          <p className="whitespace-pre-wrap">{p.excerpt}</p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await reviewCandidate(candidate.id, "use_preview", {
                  preview_id: p.id,
                });
                setMessage(
                  "Preview selected as explicit matching input. Use Reapply saved rules in Project settings to classify; existing evidence/notes remain unchanged.",
                );
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Use this preview for explicit rule reapplication
          </Button>
        </div>
      ))}
      {candidate.source_id && (
        <a
          className="block text-blue-300"
          href={`/sources/${candidate.source_id}`}
        >
          Adjust source rules or pause collection
        </a>
      )}
      <p role="status">{message}</p>
      {error && (
        <p role="alert" className="text-amber-200">
          {error}
        </p>
      )}
    </section>
  );
}
