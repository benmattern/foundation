import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  questionChoices,
  questionPacket,
  sessionWindow,
  saveSession,
} from "../services/sessionService";
import { linkQuestionArticle } from "../services/researchService";
import type { QuestionPacket, PacketLink } from "../types/session";
import {
  composeBrief,
  briefHtml,
  downloadBrief,
  packetVersions,
} from "../lib/brief";
import { Button } from "../components/ui/Button";
import { controlClass } from "../components/ui/Input";
export default function ResearchSessionPage() {
  const [params] = useSearchParams();
  const id = params.get("question");
  return id ? (
    <Session key={id} id={id} />
  ) : (
    <p>
      Choose a <Link to="/research">research question</Link> first.
    </p>
  );
}
function LinkNote({
  link,
  onSaved,
}: {
  link: PacketLink;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(link.note),
    [disposition, setDisposition] = useState(link.disposition),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await linkQuestionArticle(
            link.question_id,
            link.article_id!,
            { note, disposition },
            link,
          );
          onSaved();
        } catch (e) {
          setError(String(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block">
        Disposition
        <select
          className={controlClass}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value as typeof disposition)}
        >
          {["supporting", "challenging", "background"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="block">
        Why it matters to this question
        <textarea
          className={controlClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={busy}>
        Save comparison note
      </Button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
function Session({ id }: { id: string }) {
  const [choices, setChoices] = useState<Awaited<
      ReturnType<typeof questionChoices>
    > | null>(null),
    [cursor, setCursor] = useState<string | null>(null),
    [articles, setArticles] = useState<string[]>([]),
    [findings, setFindings] = useState<string[]>([]),
    [packet, setPacket] = useState<QuestionPacket | null>(null),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    questionChoices(id)
      .then((c) => {
        if (active) setChoices(c);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [id, revision]);
  async function act(fn: () => Promise<void>) {
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
  async function assemble() {
    const p = await questionPacket(id, articles, findings);
    if (packet && packetVersions(p) !== packetVersions(packet)) {
      setNotice(
        "Research changed. This new preview replaces the earlier snapshot; review it before downloading.",
      );
    }
    setPacket(p);
    setDraft(composeBrief(p));
  }
  async function download(html: boolean) {
    if (!packet) return;
    const latest = await questionPacket(id, articles, findings);
    if (packetVersions(latest) !== packetVersions(packet)) {
      setNotice(
        "Research changed since assembly. Your preview is preserved. Regenerate and review before downloading.",
      );
      return;
    }
    downloadBrief(html ? briefHtml(draft) : draft, html);
    setNotice("Downloaded the displayed draft locally.");
  }
  return (
    <section className="space-y-5">
      <h1 className="text-3xl">Compare evidence and create brief</h1>
      <Link className="text-blue-300" to={`/research?question=${id}`}>
        Back to question
      </Link>
      <p>
        Select up to six evidence records and twenty findings. Only selected
        content enters the frozen preview. Source reporting and analyst
        interpretation remain labelled.
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!choices && !error && <p>Loading selections…</p>}
      <Button
        disabled={busy}
        onClick={() =>
          void act(async () => {
            const w = await sessionWindow();
            await saveSession(w.version, null, id);
            setNotice("Current question saved for this project.");
          })
        }
      >
        Use as current question
      </Button>
      {choices && (
        <>
          <fieldset className="space-y-2">
            <legend>Evidence selection</legend>
            {choices.links.map((l) => (
              <label className="flex min-h-11 gap-3" key={l.id}>
                <input
                  type="checkbox"
                  disabled={!articles.includes(l.id) && articles.length >= 6}
                  checked={articles.includes(l.id)}
                  onChange={(e) =>
                    setArticles((a) =>
                      e.target.checked
                        ? [...a, l.id]
                        : a.filter((v) => v !== l.id),
                    )
                  }
                />
                {l.article_snapshot.title} — {l.disposition}
                {!l.article_id ? " (unavailable snapshot)" : ""}
                {!l.linked ? " (unlinked)" : ""}
              </label>
            ))}
          </fieldset>
          {choices.links.length > 0 && (
            <Button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  const nextCursor = choices.links.at(-1)!.id;
                  if (nextCursor === cursor) {
                    setNotice("No more evidence choices.");
                    return;
                  }
                  const c = await questionChoices(id, nextCursor);
                  setCursor(nextCursor);
                  setChoices({
                    ...choices,
                    links: [...choices.links, ...c.links],
                  });
                  if (!c.links.length) setNotice("No more evidence choices.");
                })
              }
            >
              More evidence choices
            </Button>
          )}
          <fieldset>
            <legend>Findings (20 per page, select up to 20)</legend>
            {choices.findings.map((f) => (
              <label className="flex min-h-11 gap-3" key={f.id}>
                <input
                  type="checkbox"
                  disabled={!findings.includes(f.id) && findings.length >= 20}
                  checked={findings.includes(f.id)}
                  onChange={(e) =>
                    setFindings((a) =>
                      e.target.checked
                        ? [...a, f.id]
                        : a.filter((v) => v !== f.id),
                    )
                  }
                />
                {f.observed || "Draft finding"}
              </label>
            ))}
          </fieldset>
          {!!choices.findings.length && (
            <Button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  const c = await questionChoices(
                    id,
                    null,
                    choices.findings.at(-1)!.id,
                  );
                  setChoices({
                    ...choices,
                    findings: [...choices.findings, ...c.findings],
                  });
                  if (!c.findings.length) setNotice("No more findings.");
                })
              }
            >
              More finding choices
            </Button>
          )}
          <Button disabled={busy} onClick={() => void act(assemble)}>
            Assemble / regenerate selected preview
          </Button>
        </>
      )}
      {packet && (
        <>
          <h2 className="text-2xl">{packet.question.title}</h2>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {packet.links.map((l) => (
              <article
                className="min-w-0 space-y-3 rounded-xl border border-slate-700 p-4"
                key={`${l.id}:${l.version}`}
              >
                <h3 className="text-xl">
                  {l.article?.title ?? l.article_snapshot.title}
                </h3>
                <p>Origin record: {l.source ?? "unknown"}</p>
                <p>
                  Published:{" "}
                  {l.article?.published_at ??
                    l.article_snapshot.published_at ??
                    "unknown"}
                  <br />
                  Project kept: {l.article?.created_at ?? "unavailable"}
                  <br />
                  Collected into Inbox:{" "}
                  {l.collected_at ?? "unknown / manually added"}
                  <br />
                  Link snapshot captured:{" "}
                  {l.article_snapshot.captured_at ?? "unknown"}
                </p>
                <a
                  className="break-all text-blue-300"
                  href={
                    /^https?:\/\//i.test(l.article_snapshot.url ?? "")
                      ? l.article_snapshot.url
                      : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Original source
                </a>
                {packet.links.some(
                  (other) =>
                    other.id !== l.id &&
                    l.article?.item_id &&
                    l.article.item_id === other.article?.item_id,
                ) && (
                  <p>
                    Repeated acquisition identity. Not independent confirmation.
                  </p>
                )}
                <p>Confirmed entities: {l.entities.join(", ") || "none"}</p>
                <p>Existing events: {l.events.join(", ") || "none"}</p>
                {packet.findings.flatMap((f) =>
                  f.citations
                    .filter((c) => c.id === l.article_id && c.passage)
                    .map((c, i) => (
                      <blockquote
                        key={`${f.id}:${i}`}
                        className="whitespace-pre-wrap border-l-2 pl-3"
                      >
                        {c.passage}
                        <footer>
                          {c.passage_origin?.origin ??
                            "Attribution unavailable"}
                        </footer>
                      </blockquote>
                    )),
                )}
                {l.article && l.linked ? (
                  <LinkNote
                    link={l}
                    onSaved={() => {
                      setNotice(
                        "Note saved. Regenerate the brief to include it.",
                      );
                      setRevision((n) => n + 1);
                    }}
                  />
                ) : (
                  <p>
                    Unavailable/unlinked evidence. Snapshot retained: {l.note}
                  </p>
                )}
              </article>
            ))}
          </div>
          <h2 className="text-2xl">Editable draft and exact export preview</h2>
          <p>
            Assembled {packet.as_of}. Downloads contain only this draft and its
            version manifest; no account tokens or remote assets. Edit or omit
            sections below. Regeneration replaces edits.
          </p>
          <textarea
            aria-label="Brief Markdown draft"
            className={`${controlClass} min-h-96 font-mono`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <section
            aria-label="Print-friendly brief preview"
            className="max-h-96 overflow-auto bg-white p-6 text-slate-900"
          >
            <pre className="mx-auto max-w-[75ch] whitespace-pre-wrap break-words font-sans leading-relaxed">
              {draft}
            </pre>
          </section>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void act(assemble)}>
              Regenerate brief preview
            </Button>
            <Button
              disabled={busy}
              onClick={() => void act(() => download(false))}
            >
              Download Markdown
            </Button>
            <Button
              disabled={busy}
              onClick={() => void act(() => download(true))}
            >
              Download HTML for Print / Save as PDF
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
