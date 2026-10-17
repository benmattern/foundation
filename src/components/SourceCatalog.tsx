import { useState } from "react";
import {
  sourceCatalog,
  sourcePacks,
  verificationStale,
} from "../lib/sourceCatalog";
import { selectCatalogSource } from "../services/coverageService";
import type { RssFeed } from "../types/rssFeed";
import type { Subscription } from "../types/project";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
export function SourceCatalog({
  onEnabled,
  feeds = [],
  subscriptions = [],
  archived = false,
  onAdd,
}: {
  onEnabled: () => Promise<void>;
  feeds?: RssFeed[];
  subscriptions?: Subscription[];
  archived?: boolean;
  onAdd?: () => void;
}) {
  const [query, setQuery] = useState(""),
    [region, setRegion] = useState(""),
    [language, setLanguage] = useState(""),
    [pack, setPack] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const visible = sourceCatalog.filter(
    (s) =>
      (!pack || s.packs.includes(pack)) &&
      (!region || s.region === region) &&
      (!language || s.language === language) &&
      `${s.name} ${s.topics.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  async function follow(ids: string[]) {
    setBusy(true);
    const outcomes: string[] = [];
    for (const id of ids) {
      const s = sourceCatalog.find((s) => s.id === id)!;
      try {
        await selectCatalogSource(s);
        outcomes.push(
          `${s.name}: selected. Existing pause/unfollow decisions and rules retained.`,
        );
      } catch (e) {
        outcomes.push(`${s.name}: ${String(e)}`);
      }
    }
    try {
      await onEnabled();
    } catch (e) {
      outcomes.push(`Refresh failed: ${String(e)}`);
    }
    setMessage(outcomes.join("\n"));
    setBusy(false);
  }
  return (
    <section className="space-y-4 rounded-xl border border-slate-700 p-4">
      <h2 className="text-xl">Discover sources</h2>
      <p>
        Optional official-source suggestions. Preview a pack, then select
        individual publishers. No automatic subscription or claim of complete
        coverage. Company and government releases represent their own
        perspectives.
      </p>
      <label className="block">
        Preview source pack
        <select
          className={controlClass}
          value={pack}
          onChange={(e) => setPack(e.target.value)}
        >
          <option value="">All packs / original entries</option>
          {sourcePacks.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <p>
        {visible.length} publisher records,{" "}
        {visible.filter((s) => s.feedUrl).length} automatic feeds,{" "}
        {visible.filter((s) => !s.feedUrl).length} manual-only.{" "}
        {selected.length} selected across filters.
      </p>
      <Input
        label="Search catalog topics"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label="Catalog region"
        className={controlClass}
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="">All regions</option>
        {[...new Set(sourceCatalog.map((s) => s.region))].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <select
        aria-label="Catalog language"
        className={controlClass}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="">All languages</option>
        {[...new Set(sourceCatalog.map((s) => s.language))].map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busy || archived || !selected.length}
          onClick={() => void follow(selected)}
        >
          Follow selected feeds / save manual sources ({selected.length})
        </Button>
        <Button onClick={() => setSelected([])}>Clear selection</Button>
      </div>
      {visible.map((s) => {
        const feed = feeds.find((f) => f.feed_url === s.feedUrl),
          sub = subscriptions.find((p) => p.feed_id === feed?.id),
          followed = !!sub && sub.followed !== false;
        return (
          <article
            key={s.id}
            className="space-y-2 border-t border-slate-700 py-4"
          >
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={(e) =>
                  setSelected((a) =>
                    e.target.checked
                      ? [...a, s.id]
                      : a.filter((id) => id !== s.id),
                  )
                }
              />
              <span className="text-xl">{s.name}</span>
            </label>
            <p>
              {s.topics.join(", ")} · {s.region} · {s.language}
            </p>
            <p>
              {s.connector === "Manual"
                ? "Manual-only — no automatic feed configured"
                : `${s.connector} · available fields: ${s.fields.join(", ")}`}
            </p>
            <p>{s.limits}</p>
            <p>Perspective: {s.perspective}</p>
            <p>
              Verified {s.verifiedOn} UTC{" "}
              {verificationStale(s.verifiedOn)
                ? "— STALE verification; recheck before relying on availability"
                : ""}
              . {s.check}
            </p>
            <details>
              <summary>Access and use limits</summary>
              <p>{s.use}</p>
            </details>
            <a
              className="text-blue-300"
              href={s.listedAt}
              target="_blank"
              rel="noreferrer"
            >
              Publisher feed listing / official releases
            </a>
            <Button
              className="ml-3"
              disabled={busy || archived || followed}
              onClick={() => void follow([s.id])}
            >
              {followed
                ? sub.enabled
                  ? feed?.is_active
                    ? "Following"
                    : "Following - feed unavailable"
                  : "Paused — retained"
                : s.feedUrl
                  ? "Follow source"
                  : "Save manual source"}
            </Button>
            {sub?.followed === false && (
              <p>
                Unfollowed — retained. Use Following / saved source controls to
                deliberately resume.
              </p>
            )}
          </article>
        );
      })}
      {!visible.length && (
        <div>
          <h3>No curated source matches</h3>
          <p>
            Try another filter or <Button onClick={onAdd}>Add source</Button>.
          </p>
        </div>
      )}
      {message && (
        <p role="status" className="whitespace-pre-wrap">
          {message}
        </p>
      )}
    </section>
  );
}
