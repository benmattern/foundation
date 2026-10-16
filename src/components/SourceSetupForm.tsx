import { useRef, useState } from "react";
import { createSource, updateSource } from "../services/sourceService";
import { createRssFeed, updateRssFeed } from "../services/rssFeedService";
import { saveSubscription } from "../services/projectService";
import { normalizeImportUrl } from "../lib/urlImport";
import type { Source } from "../types/source";
import type { RssFeed } from "../types/rssFeed";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";

export function SourceSetupForm({
  source,
  onDone,
  onCancel,
  onBusyChange,
}: {
  source?: Source;
  onDone: (source: Source, automatic: boolean) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [name, setName] = useState(source?.name ?? "");
  const [website, setWebsite] = useState(source?.url ?? "");
  const [feedUrl, setFeedUrl] = useState("");
  const [follow, setFollow] = useState(true);
  const [category, setCategory] = useState(source?.category ?? "");
  const [notes, setNotes] = useState(source?.notes ?? "");
  const savedSource = useRef<Source | undefined>(source);
  const savedFeed = useRef<RssFeed | undefined>(undefined);
  const [feedSaved, setFeedSaved] = useState(false);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [partial, setPartial] = useState(false);
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        onBusyChange?.(true);
        setError("");
        try {
          if (!name.trim()) throw new Error("Enter a source name.");
          const url = normalizeImportUrl(website);
          const feed = feedUrl.trim() ? normalizeImportUrl(feedUrl) : null;
          const values = { name: name.trim(), url, category, notes };
          const record = savedSource.current
            ? await updateSource(savedSource.current.id, values)
            : await createSource(values);
          savedSource.current = record;
          setPartial(true);
          if (feed) {
            const values = {
              feed_url: feed,
              source_id: record.id,
              title: record.name,
              is_active: savedFeed.current?.is_active ?? true,
            };
            savedFeed.current = savedFeed.current
              ? await updateRssFeed(savedFeed.current.id, values)
              : await createRssFeed(values);
            setFeedSaved(true);
            await saveSubscription(savedFeed.current.id, follow);
          }
          onDone(record, !!feed && follow);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Setup could not finish. Your entries are preserved. Retry to continue.",
          );
        } finally {
          locked.current = false;
          setBusy(false);
          onBusyChange?.(false);
        }
      }}
    >
      <Input
        label="Source name"
        required
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
      />
      <Input
        label="Website"
        type="url"
        required
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        disabled={busy}
        hint="The publisher's website is a reference for manual research. It does not collect incoming items."
      />
      <Input
        label="Feed URL (optional)"
        type="url"
        value={feedUrl}
        onChange={(e) => setFeedUrl(e.target.value)}
        disabled={busy || feedSaved}
        hint={source
          ? "Add another RSS/Atom feed if needed. Leaving blank keeps existing collection unchanged."
          : "An RSS/Atom feed supplies incoming items automatically. Leave blank to save a manual-only source."}
      />
      {feedUrl && (
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={follow}
            disabled={busy}
            onChange={(e) => setFollow(e.target.checked)}
          />
          Follow in this project
        </label>
      )}
      <details>
        <summary>Source notes and category</summary>
        <div className="space-y-4 pt-3">
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Textarea
            label="Source notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </details>
      {partial && error && (
        <p
          role="status"
          className="rounded-lg border border-amber-700 p-3 text-amber-200"
        >
          The source is saved{feedSaved ? " and the feed is saved" : ""}.
          Collection setup is unfinished. Retry continues with these records; it
          will not create them again.
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" type="submit" busy={busy}>
          {partial && error ? "Retry setup" : "Save source"}
        </Button>
        <Button disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
