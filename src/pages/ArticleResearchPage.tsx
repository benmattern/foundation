import { useResearchAction } from "../lib/useResearchAction";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Input, controlClass } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  ArticleNoteEditor,
  EntityEditor,
  EvidenceLinkEditor,
} from "../components/ResearchEditors";
import { useResearchData } from "../lib/useResearchData";
import { suggestMentions, relatedArticleIds } from "../lib/research";
import {
  getResearchEvidence,
  saveMentions,
  reviewMention,
} from "../services/researchService";
import type {
  ResearchEvidence,
  MentionDraft,
  Mention,
} from "../types/research";

export default function ArticleResearchPage() {
  const { id } = useParams();
  return <ArticleResearchWorkspace key={id} id={id} />;
}
function ArticleResearchWorkspace({ id }: { id?: string }) {
  const { data, error, refresh } = useResearchData();
  const [evidence, setEvidence] = useState<ResearchEvidence[]>([]),
    [evidenceError, setEvidenceError] = useState("");
  const [entitySearch, setEntitySearch] = useState(""),
    [entityId, setEntityId] = useState(""),
    [passage, setPassage] = useState(""),
    [createEntity, setCreateEntity] = useState(false);
  const [questionSearch, setQuestionSearch] = useState(""),
    [questionId, setQuestionId] = useState("");
  const [drafts, setDrafts] = useState<MentionDraft[] | null>(null),
    [selectedDrafts, setSelectedDrafts] = useState<number[]>([]),
    [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const action = useResearchAction();
  useEffect(() => {
    let active = true;
    if (id)
      getResearchEvidence(id)
        .then((v) => {
          if (active) {
            setEvidence(v);
            setEvidenceError("");
          }
        })
        .catch((e) => {
          if (active) setEvidenceError(String(e));
        });
    return () => {
      active = false;
    };
  }, [id]);
  const article = data?.articles.find((a) => a.id === id);
  const mentions = data?.mentions.filter((m) => m.article_id === id) ?? [];
  const note = data?.notes.find((n) => n.article_id === id);
  const linkedQuestions = data?.links.filter((l) => l.article_id === id) ?? [];
  const related =
    id && data
      ? relatedArticleIds(id, data.mentions, data.links, data.eventLinks)
      : new Set<string>();
  async function batchReview(state: Mention["state"]) {
    const failed: string[] = [];
    for (const m of mentions.filter((m) => selectedMentions.includes(m.id))) {
      try {
        await reviewMention(m, state);
      } catch (e) {
        failed.push(`${m.matched_alias}: ${String(e)}`);
      }
    }
    setMessage(
      failed.length
        ? `Some reviews failed; selection preserved: ${failed.join("; ")}`
        : `Updated ${selectedMentions.length} selected mentions.`,
    );
    if (!failed.length) setSelectedMentions([]);
    refresh();
  }
  return (
    <section className="space-y-6">
      <PageHeader
        title={article?.title ?? "Article research"}
        description="Inspect available evidence and add project-specific connections."
      />
      {error && (
        <p role="alert">
          {error} <Button onClick={refresh}>Retry article</Button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {action.status}
      {data && !article && (
        <div className="space-y-3">
          <p>
            Article unavailable in this project.{" "}
            <Link to="/articles" className="text-blue-300">
              Return to Library
            </Link>
          </p>
          {data.notes
            .filter((n) => n.article_snapshot.id === id)
            .map((n) => (
              <div
                className="rounded-lg border border-amber-900 p-4"
                key={n.id}
              >
                <h2 className="font-semibold">
                  Retained analyst note: {n.article_snapshot.title}
                </h2>
                <p className="whitespace-pre-wrap">{n.body}</p>
              </div>
            ))}
          {data.links
            .filter((l) => l.article_snapshot.id === id)
            .map((l) => (
              <p key={l.id}>
                Retained evidence link:{" "}
                <Link
                  className="text-blue-300"
                  to={`/research?question=${l.question_id}`}
                >
                  {data.questions.find((q) => q.id === l.question_id)?.title ??
                    "Question unavailable"}
                </Link>
                . {l.note}
              </p>
            ))}
        </div>
      )}
      {article && data && (
        <>
          <p>
            <a
              className="break-all text-blue-300"
              href={article.url}
              target="_blank"
              rel="noreferrer"
            >
              Open original article
            </a>
          </p>
          <p>
            Published {article.published_at ?? "unknown"}. Source/collector:{" "}
            {data.sources.find((s) => s.id === article.source_id)?.name ??
              "Unknown"}
            ; publisher identity is not inferred from this label.
          </p>
          <section className="space-y-4 rounded-xl border border-slate-700 p-4">
            <h2 className="text-2xl font-semibold">Available evidence</h2>
            <p className="text-slate-400">
              Suggestions examine only the fields shown here, never the complete
              article or analyst notes. Select a passage with the pointer to
              fill the manual association below; keyboard/mobile users can type
              or paste it.
            </p>
            {evidenceError && (
              <p role="alert">
                Evidence could not load: {evidenceError}. Manual association and
                review remain available.
              </p>
            )}
            <div
              className="space-y-4"
              onMouseUp={(e) => {
                const selection = window.getSelection();
                if (
                  selection?.anchorNode &&
                  e.currentTarget.contains(selection.anchorNode) &&
                  selection.focusNode &&
                  e.currentTarget.contains(selection.focusNode)
                ) {
                  const text = selection.toString().slice(0, 2000);
                  if (text.trim()) setPassage(text);
                }
              }}
            >
              {evidence.map((field) => (
                <details key={field.field} open>
                  <summary>{field.origin}</summary>
                  <p className="whitespace-pre-wrap break-words leading-7">
                    {field.text || "No supplied text"}
                  </p>
                </details>
              ))}
            </div>
            {article.summary && (
              <details>
                <summary>
                  Saved summary / legacy mixed analyst text (not verified
                  publisher excerpt)
                </summary>
                <p className="whitespace-pre-wrap">{article.summary}</p>
              </details>
            )}
            <ArticleNoteEditor
              key={`${article.id}:${note?.version ?? 0}`}
              article={article}
              note={note}
              onSaved={() => {
                setMessage("Article note saved.");
                refresh();
              }}
            />
          </section>
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Research questions</h2>
            <Link
              className="text-blue-300"
              to={`/research?articles=${article.id}`}
            >
              Create research question with this article
            </Link>
            <Input
              label="Search existing questions"
              type="search"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
            />
            <label className="block">
              Add to question
              <select
                className={controlClass}
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
              >
                <option value="">Choose a question</option>
                {data.questions
                  .filter((q) =>
                    q.title
                      .toLowerCase()
                      .includes(questionSearch.toLowerCase()),
                  )
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.status})
                    </option>
                  ))}
              </select>
            </label>
            {questionId &&
              !linkedQuestions.some((l) => l.question_id === questionId) &&
              data.questions.find((q) => q.id === questionId) && (
                <EvidenceLinkEditor
                  key={questionId}
                  question={data.questions.find((q) => q.id === questionId)!}
                  article={article}
                  onSaved={refresh}
                />
              )}
            {linkedQuestions.map((l) => {
              const q = data.questions.find((q) => q.id === l.question_id);
              return (
                q && (
                  <details key={`${l.id}:${l.version}`} open={l.linked}>
                    <summary>
                      {q.title}:{" "}
                      {l.linked ? l.disposition : "unlinked (note retained)"}
                    </summary>
                    <EvidenceLinkEditor
                      question={q}
                      article={article}
                      link={l}
                      onSaved={refresh}
                    />
                  </details>
                )
              );
            })}
          </section>
          <section className="space-y-4 rounded-xl border border-slate-700 p-4">
            <h2 className="text-2xl font-semibold">
              People, organizations and places
            </h2>
            <Input
              label="Search entity names / aliases"
              value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
            />
            <label className="block">
              Existing identity
              <select
                className={controlClass}
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              >
                <option value="">Choose an identity</option>
                {data.entities
                  .filter((e) =>
                    [e.name, ...e.aliases, e.description]
                      .join(" ")
                      .toLowerCase()
                      .includes(entitySearch.toLowerCase()),
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} - {e.entity_type} - {e.description}
                    </option>
                  ))}
              </select>
            </label>
            <Textarea
              label="Manual association passage / note (optional)"
              value={passage}
              maxLength={2000}
              onChange={(e) => setPassage(e.target.value)}
            />
            <Button
              disabled={!entityId || action.busy}
              onClick={() =>
                void action.run(async () => {
                  const entity = data.entities.find((e) => e.id === entityId)!;
                  await saveMentions(
                    article.id,
                    [
                      {
                        entity_id: entityId,
                        alias: entity.name,
                        snapshot: passage,
                      },
                    ],
                    true,
                  );
                  setMessage(
                    "Manual association saved (or already present). Prior dismissed associations require explicit confirmation below.",
                  );
                  refresh();
                })
              }
            >
              Link selected entity manually
            </Button>
            <Button onClick={() => setCreateEntity((v) => !v)}>
              Create a distinct entity
            </Button>
            {createEntity && (
              <EntityEditor
                initialName={passage.length <= 200 ? passage : ""}
                onSaved={(e) => {
                  setEntityId(e.id);
                  setCreateEntity(false);
                  setMessage(
                    "Identity saved. Link it explicitly to this article.",
                  );
                  refresh();
                }}
              />
            )}
            <Button
              disabled={action.busy}
              onClick={() => {
                const proposals = suggestMentions(evidence, data.entities);
                setDrafts(proposals);
                setSelectedDrafts(proposals.map((_, i) => i));
              }}
            >
              Preview known-name rescan
            </Button>
            <p className="text-sm text-slate-400">
              Explicit rescan checks up to 500 identities, 1,000 names total, 22
              evidence fields and 200 suggestions. Whole terms use the intake
              matcher. Every hit requires review; short/ambiguous aliases are
              flagged. Alias edits do not change saved evidence or revive
              dismissed matches.
            </p>
            {drafts && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Rescan preview ({drafts.length}, none confirmed)
                </h3>
                {!drafts.length && (
                  <p>
                    No known names matched the available fields. Use manual
                    linking or edit approved aliases.
                  </p>
                )}
                {drafts.map((d, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-slate-700 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDrafts.includes(i)}
                      onChange={(e) =>
                        setSelectedDrafts((s) =>
                          e.target.checked
                            ? [...s, i]
                            : s.filter((n) => n !== i),
                        )
                      }
                    />
                    <span>
                      {data.entities.find((e) => e.id === d.entity_id)?.name}:{" "}
                      {d.alias} in {d.field}.{" "}
                      {d.ambiguous
                        ? "Ambiguous alias: multiple identities. "
                        : ""}
                      {d.short ? "Short alias: extra review required. " : ""}
                      <span className="block text-sm text-slate-400">
                        Normalized span {d.span.start}-{d.span.end}; snapshot
                        retained on save.
                      </span>
                    </span>
                  </label>
                ))}
                <Button
                  disabled={action.busy || !selectedDrafts.length}
                  onClick={() =>
                    void action.run(async () => {
                      const added = await saveMentions(
                        article.id,
                        drafts.filter((_, i) => selectedDrafts.includes(i)),
                      );
                      setMessage(
                        `${added} new suggestions saved; prior confirmed/dismissed evidence preserved.`,
                      );
                      setDrafts(null);
                      refresh();
                    })
                  }
                >
                  Save selected suggestions for review
                </Button>
              </div>
            )}
            <h3 className="text-xl font-semibold">
              Saved mentions ({mentions.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={action.busy || !selectedMentions.length}
                onClick={() => void action.run(() => batchReview("confirmed"))}
              >
                Confirm selected mentions ({selectedMentions.length})
              </Button>
              <Button
                disabled={action.busy || !selectedMentions.length}
                onClick={() => void action.run(() => batchReview("dismissed"))}
              >
                Dismiss selected mentions
              </Button>
            </div>
            {mentions.map((m) => (
              <article
                key={`${m.id}:${m.version}`}
                className="space-y-3 rounded-lg border border-slate-700 p-4"
              >
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedMentions.includes(m.id)}
                    onChange={(e) =>
                      setSelectedMentions((s) =>
                        e.target.checked
                          ? [...s, m.id]
                          : s.filter((id) => id !== m.id),
                      )
                    }
                  />
                  Select {m.matched_alias} ({m.source_field})
                </label>
                <p>
                  <Link
                    className="text-blue-300"
                    to={`/entities?entity=${m.entity_id}`}
                  >
                    {data.entities.find((e) => e.id === m.entity_id)?.name ??
                      "Identity unavailable"}
                  </Link>
                  : <strong>{m.state}</strong>
                  {m.manual ? " / manual analyst association" : ""}
                </p>
                <details>
                  <summary>Inspect evidence and provenance</summary>
                  <p>
                    {m.matched_alias} in {m.source_field}; matcher v
                    {m.matcher_version}; normalized span{" "}
                    {m.span?.start ?? "not applicable"}-{m.span?.end ?? ""}.
                  </p>
                  <p className="whitespace-pre-wrap">
                    {m.snapshot || "No passage supplied."}
                  </p>
                </details>
                <div className="flex flex-wrap gap-3">
                  {m.state !== "confirmed" && (
                    <Button
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await reviewMention(m, "confirmed");
                          refresh();
                        })
                      }
                    >
                      Confirm mention
                    </Button>
                  )}
                  {m.state !== "dismissed" && (
                    <Button
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await reviewMention(m, "dismissed");
                          refresh();
                        })
                      }
                    >
                      Dismiss mention
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Events</h2>
            <ul>
              {data.events
                .filter((e) =>
                  data.eventLinks.some(
                    (l) => l.article_id === article.id && l.event_id === e.id,
                  ),
                )
                .map((e) => (
                  <li key={e.id}>
                    <Link className="text-blue-300" to={`/events/${e.id}`}>
                      {e.title}
                    </Link>
                  </li>
                ))}
            </ul>
            <Link to={`/events?article=${id}`} className="text-blue-300">
              Manage existing event links
            </Link>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Related articles</h2>
            <p className="text-slate-400">
              Shared confirmed identities, linked questions or manually linked
              events; connections are not proof of independent corroboration.
            </p>
            <ul>
              {data.articles
                .filter((a) => related.has(a.id))
                .map((a) => (
                  <li key={a.id}>
                    <Link className="text-blue-300" to={`/articles/${a.id}`}>
                      {a.title}
                    </Link>
                  </li>
                ))}
            </ul>
            {!related.size && <p>No confirmed shared connections yet.</p>}
          </section>
          <details>
            <summary>Research change history for this article</summary>
            <ul className="space-y-2">
              {data.history
                .filter((h) =>
                  JSON.stringify(h.after_state).includes(article.id),
                )
                .slice(-30)
                .map((h) => (
                  <li key={h.id}>
                    <p>
                      {h.recorded_at} - {h.object_type}
                    </p>
                    <details>
                      <summary>Inspect saved change</summary>
                      <pre className="whitespace-pre-wrap break-all text-xs">
                        {JSON.stringify(
                          { before: h.before_state, after: h.after_state },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </li>
                ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
