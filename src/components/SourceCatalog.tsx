import { useState } from "react";
import { sourceCatalog } from "../lib/sourceCatalog";
import { enableCatalogFeed } from "../services/sourceService";

export function SourceCatalog(
  { onEnabled }: { onEnabled: () => Promise<void> },
) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="space-y-3 rounded border border-slate-700 p-4 text-slate-300">
      <h2 className="text-xl">Source catalog</h2>
      <p>
        A small starter catalog. Add other publishers and feeds manually. Feed
        availability is checked during collection.
      </p>
      <input
        aria-label="Search catalog topics"
        placeholder="Search publisher or topic"
        className="bg-slate-800 p-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label="Catalog region"
        className="bg-slate-800 p-2"
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
        className="bg-slate-800 p-2"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="">All languages</option>
        {[...new Set(sourceCatalog.map((s) => s.language))].map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      {sourceCatalog.filter((s) =>
        (!region || s.region === region) &&
        (!language || s.language === language) &&
        `${s.name} ${s.topics.join(" ")}`.toLowerCase().includes(
          query.trim().toLowerCase(),
        )
      ).map((source) => (
        <article
          className="space-y-2 border-t border-slate-700 pt-3"
          key={source.feedUrl}
        >
          <h3>{source.name}</h3>
          <p>
            {source.topics.join(", ")} · {source.region} · {source.language}
          </p>
          <p>
            {source.connector}{" "}
            · Metadata, excerpts and original links · Public feed, no login.
            Publisher retrieval/parser check passed October 16, 2026. See RSS
            for workspace health.
          </p>
          <a
            href={source.listedAt}
            target="_blank"
            rel="noreferrer"
            className="text-blue-300"
          >
            Publisher feed listing
          </a>
          <button
            className="ml-4"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                await enableCatalogFeed(source);
                await onEnabled();
                setMessage(
                  `${source.name} enabled for this project. Manage selected feeds and rules on RSS.`,
                );
              } catch (error) {
                setMessage(String(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            Enable in project
          </button>
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
