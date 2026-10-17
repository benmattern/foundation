import { useState } from "react";
import { Link } from "react-router-dom";
import {
  calibrationWindow,
  saveTuningExample,
  type CalibrationItem,
  type CalibrationWindow,
} from "../services/coverageService";
import { getTags } from "../services/tagService";
import { saveProjectRules } from "../services/ruleService";
import { previewCalibration } from "../lib/calibration";
import { RuleEditor } from "./RuleEditor";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";
import type { Rules } from "../../supabase/functions/_shared/rules";
function Example({
  item,
  onSave,
  busy,
}: {
  item: CalibrationItem;
  onSave: (useful: boolean, heldOut: boolean) => void;
  busy: boolean;
}) {
  const [held, setHeld] = useState(item.feedback?.held_out ?? false);
  return (
    <article className="space-y-2 rounded-xl border border-slate-700 p-4">
      <h3 className="text-xl">{item.title ?? item.url}</h3>
      <p>
        Collected {item.created_at}; published {item.published_at ?? "unknown"}.
        Review: {item.status}
        {item.deferred ? " / Later" : ""}; routing: {item.route ?? "unknown"}.
      </p>
      <p>
        Historical first recorded rule version:{" "}
        {item.first_rule_result?.version ?? "unknown"}; stored result:{" "}
        {item.rule_result?.version ?? "unknown"}; current project:{" "}
        {item.current_project_rules.version}; current feed override:{" "}
        {item.current_subscription_rules?.version ?? "inherited"}.
      </p>
      <p className="whitespace-pre-wrap">
        Original acquisition excerpt:{" "}
        {String(
          item.original_acquisition?.description ?? "(unavailable)",
        ).slice(0, 2500)}
      </p>
      <a
        className="break-all text-blue-300"
        href={/^https?:\/\//i.test(item.url) ? item.url : undefined}
        target="_blank"
        rel="noreferrer"
      >
        Original source
      </a>
      {item.converted_article_id && (
        <Link
          className="ml-4 text-blue-300"
          to={`/articles/${item.converted_article_id}`}
        >
          Kept article
        </Link>
      )}
      <details>
        <summary>Stored first/current matching results</summary>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-sm">
          {JSON.stringify(
            { first: item.first_rule_result, current: item.rule_result },
            null,
            2,
          )}
        </pre>
      </details>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={held}
          onChange={(e) => setHeld(e.target.checked)}
        />
        Reserve as held-out example (excluded from draft tuning preview)
      </label>
      <p>
        Tuning label:{" "}
        {item.feedback
          ? item.feedback.useful
            ? "Useful"
            : "Not useful"
          : "Not labelled"}
        . This is separate from Keep/Dismiss.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => onSave(true, held)}>
          Useful for tuning
        </Button>
        <Button disabled={busy} onClick={() => onSave(false, held)}>
          Not useful for tuning
        </Button>
      </div>
    </article>
  );
}
export function IntakeCalibration({ sources }: { sources: Source[] }) {
  const today = new Date().toISOString().slice(0, 10),
    [since, setSince] = useState(() =>
      new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
    ),
    [until, setUntil] = useState(today),
    [source, setSource] = useState(""),
    [data, setData] = useState<CalibrationWindow | null>(null),
    [sample, setSample] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<ReturnType<typeof previewCalibration>>([]),
    [rules, setRules] = useState<Rules | null>(null),
    [tags, setTags] = useState<Tag[]>([]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function load(sampling: boolean) {
    const upper = new Date(
      Math.min(Date.now(), Date.parse(until + "T00:00:00Z") + 86400000),
    ).toISOString();
    const d = await calibrationWindow(
      since + "T00:00:00Z",
      upper,
      source || null,
      null,
      sampling,
    );
    setData(d);
    setSample(sampling);
    setPreview([]);
    setRules(d.items[0]?.current_project_rules ?? null);
    setTags(await getTags());
  }
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Intake calibration</h2>
      <p>
        Current decisions for items collected during a bounded UTC period
        (maximum 90 days). One acquisition identity per project; repeated
        collection and other projects do not inflate totals. Routing is the
        stored current routing, not reconstructed arrival routing.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Collected from (UTC)"
          type="date"
          value={since}
          onChange={(e) => setSince(e.target.value)}
        />
        <Input
          label="Collected through (UTC)"
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
        />
        <label>
          Selected source or project
          <select
            className={controlClass}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">Entire project</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void run(() => load(false))}>
          Load period counts and examples
        </Button>
        <Button disabled={busy} onClick={() => void run(() => load(true))}>
          Request outside-scope / low-ranked sample
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <p>
            Count boundary: [{data.since}, {data.until}); decisions read as of{" "}
            {data.as_of}.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries({
              Collected: data.collected,
              "Pending route": data.pending_route,
              "Outside-scope route": data.outside,
              Kept: data.kept,
              Dismissed: data.dismissed,
              Deferred: data.deferred,
              "Unreviewed (includes Later)": data.unreviewed,
              "Duplicate decisions": data.duplicate,
            }).map(([k, v]) => (
              <p className="rounded-lg border border-slate-700 p-3" key={k}>
                {k}: {v}
              </p>
            ))}
          </div>
          <p>
            Reviewed keep rate:{" "}
            {data.kept + data.dismissed
              ? `${Math.round((100 * data.kept) / (data.kept + data.dismissed))}% (${data.kept} / ${data.kept + data.dismissed})`
              : "unavailable — no Keep/Dismiss decisions"}
            . Denominator is Keep + Dismiss only; excludes pending, Later and
            duplicate decisions. A workflow statistic, never recall, truth,
            credibility or investment performance.
          </p>
          <p>
            {sample
              ? "Convenience sample: outside scope OR stored relevance ≤ 1; first ten eligible IDs, not random or representative."
              : "Examples ordered by stable candidate ID, 25 per page."}{" "}
            Population {data.sample_population}; displayed {data.items.length}.
            Reused labelled examples are tuning data; held-out rows are withheld
            from previews. Counts describe the whole period, not this page.
          </p>
          {data.items.map((c) => (
            <Example
              key={`${c.id}:${c.feedback?.version ?? 0}`}
              item={c}
              busy={busy}
              onSave={(useful, held) =>
                void run(async () => {
                  const feedback = await saveTuningExample(c, useful, held);
                  setData({
                    ...data,
                    items: data.items.map((row) =>
                      row.id === c.id ? { ...row, feedback } : row,
                    ),
                  });
                  setPreview([]);
                })
              }
            />
          ))}
          {!data.items.length && (
            <p>No examples in this selection. No rules or decisions changed.</p>
          )}
          {data.has_more && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const next = await calibrationWindow(
                    data.since,
                    data.until,
                    data.source_id,
                    data.items.at(-1)!.id,
                    sample,
                  );
                  setData({ ...next, items: [...data.items, ...next.items] });
                  setPreview([]);
                })
              }
            >
              More authorized examples
            </Button>
          )}
          {rules && (
            <details>
              <summary>
                Compare a proposed project rule with these examples
              </summary>
              <p>
                Preview uses the displayed examples only, applies existing feed
                overrides, and excludes held-out labels. Historical rules are
                not overwritten. Save relevance rules explicitly applies only
                future intake; existing review decisions remain intact.
              </p>
              <RuleEditor
                initial={rules}
                tags={tags}
                onPreview={async (draft) =>
                  setPreview(previewCalibration(data.items, draft, data.as_of))
                }
                onSave={async (draft) => {
                  await saveProjectRules(draft, rules);
                  setRules(draft);
                  setPreview([]);
                }}
              />
              <ul>
                {preview.map((r) => (
                  <li className={r.lost ? "text-amber-200" : ""} key={r.id}>
                    {r.title ?? r.id}:{" "}
                    {r.held_out
                      ? "Held out — not evaluated"
                      : r.lost
                        ? "WARNING: previously Useful example would be excluded"
                        : r.route}{" "}
                    {r.held_out
                      ? ""
                      : "(reused tuning example, not a recall test)"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
