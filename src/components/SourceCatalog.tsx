import { saveSubscription } from "../services/projectService";
import type { RssFeed } from "../types/rssFeed";
import type { Subscription } from "../types/project";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
import { EmptyState } from "./ui/EmptyState";
import { useState } from "react";
import { sourceCatalog } from "../lib/sourceCatalog";
import { enableCatalogFeed } from "../services/sourceService";

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
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="space-y-3 rounded border border-slate-700 p-4 text-slate-300">
      <h2 className="text-xl">Discover sources</h2>
      <p>
        This small starter catalog covers US economics and UK defence, not
        comprehensive regional coverage. Add other publishers and feeds
        manually.
      </p>
      <Input
        label="Search catalog topics"
        placeholder="Search publisher or topic"
        className={controlClass}
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
      {sourceCatalog
        .filter(
          (s) =>
            (!region || s.region === region) &&
            (!language || s.language === language) &&
            `${s.name} ${s.topics.join(" ")}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .map((source) => {
          const feed = feeds.find((f) => f.feed_url === source.feedUrl);
          const subscription = subscriptions.find(
            (s) => s.feed_id === feed?.id,
          );
          const followed = !!subscription?.enabled;
          return (
            <article
              className="space-y-2 border-t border-slate-700 pt-3"
              key={source.feedUrl}
            >
              <h3>{source.name}</h3>
              <p>
                {source.topics.join(", ")} · {source.region} · {source.language}
              </p>
              <p>
                {source.connector} · Metadata, excerpts and original links ·
                Public feed, no login. Availability and health are shown in
                Following after setup.
              </p>
              <a
                href={source.listedAt}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300"
              >
                Publisher feed listing
              </a>
              <Button
                className="ml-4"
                disabled={busy || archived || followed}
                onClick={async () => {
                  setBusy(true);
                  setMessage("");
                  try {
                    if (feed)
                      await saveSubscription(
                        feed.id,
                        true,
                        subscription?.rules ?? null,
                        subscription?.rules ?? null,
                      );
                    else await enableCatalogFeed(source);
                    await onEnabled();
                    setMessage(
                      `${source.name} followed in this project. Open Following to check for incoming items.`,
                    );
                  } catch (error) {
                    setMessage(String(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {followed
                  ? feed?.is_active
                    ? "Following"
                    : "Following - feed unavailable"
                  : subscription
                    ? "Resume following"
                    : "Follow source"}
              </Button>
            </article>
          );
        })}
      {!sourceCatalog.some(
        (s) =>
          (!region || s.region === region) &&
          (!language || s.language === language) &&
          (s.name + " " + s.topics.join(" "))
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ) && (
        <EmptyState
          title="No curated source matches"
          action={onAdd && <Button onClick={onAdd}>Add source</Button>}
        >
          Try another topic or add a source you already use. This catalog is
          deliberately small.
        </EmptyState>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
