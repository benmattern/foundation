import { useResearchAction } from "../lib/useResearchAction";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Article } from "../types/article";
import type {
  Entity,
  Question,
  QuestionArticle,
  Finding,
  ArticleNote,
} from "../types/research";
import {
  saveEntity,
  saveQuestion,
  linkQuestionArticle,
  saveFinding,
  saveArticleNote,
} from "../services/researchService";
import type { ResearchData } from "../lib/useResearchData";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

export function EntityEditor({
  entity,
  onSaved,
  initialName = "",
}: {
  entity?: Entity;
  onSaved: (e: Entity) => void;
  initialName?: string;
}) {
  const [request] = useState(() => crypto.randomUUID());
  const [name, setName] = useState(entity?.name ?? initialName),
    [kind, setKind] = useState<Entity["entity_type"]>(
      entity?.entity_type ?? "organization",
    ),
    [aliases, setAliases] = useState(entity?.aliases.join("\n") ?? ""),
    [description, setDescription] = useState(entity?.description ?? ""),
    [reference, setReference] = useState(entity?.reference_url ?? "");
  const action = useResearchAction();
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-700 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () =>
          onSaved(
            await saveEntity(
              {
                name,
                entity_type: kind,
                aliases: aliases
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
                description,
                reference_url: reference,
              },
              entity,
              request,
            ),
          ),
        );
      }}
    >
      <h3 className="text-lg font-semibold">
        {entity ? "Edit entity" : "Create entity"}
      </h3>
      <p className="text-sm text-slate-400">
        Identity and aliases are reusable across your projects. Associations and
        research stay in the active project. Overlapping names do not merge
        identities.
      </p>
      <Input
        label="Preferred entity name"
        required
        maxLength={200}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="block">
        Entity type
        <select
          className={controlClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as Entity["entity_type"])}
        >
          <option value="person">Person</option>
          <option value="organization">Organization / institution</option>
          <option value="place">Place</option>
        </select>
      </label>
      <Textarea
        label="Approved aliases, one per line"
        value={aliases}
        onChange={(e) => setAliases(e.target.value)}
      />
      <Textarea
        label="Entity description / disambiguation"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Reference URL (optional)"
        type="url"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button type="submit" variant="primary" disabled={action.busy}>
        Save entity
      </Button>
      {action.status}
    </form>
  );
}
export function QuestionEditor({
  question,
  onSaved,
}: {
  question?: Question;
  onSaved: (q: Question) => void;
}) {
  const [request] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState(question?.title ?? ""),
    [description, setDescription] = useState(question?.description ?? ""),
    [status, setStatus] = useState<Question["status"]>(
      question?.status ?? "open",
    ),
    [answer, setAnswer] = useState(question?.answer ?? ""),
    [followups, setFollowups] = useState(question?.followups ?? "");
  const action = useResearchAction();
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-700 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () =>
          onSaved(
            await saveQuestion(
              { title, description, status, answer, followups },
              question,
              request,
            ),
          ),
        );
      }}
    >
      <h2 className="text-xl font-semibold">
        {question ? "Question and evolving answer" : "Create research question"}
      </h2>
      <Input
        label="Question title"
        required
        maxLength={300}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        label="Question description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="block">
        Question status
        <select
          className={controlClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as Question["status"])}
        >
          {(["open", "monitoring", "answered", "archived"] as const).map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </label>
      <Textarea
        label="Evolving answer / question notes"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <Textarea
        label="Unresolved follow-ups"
        value={followups}
        onChange={(e) => setFollowups(e.target.value)}
      />
      <p className="text-sm text-slate-400">
        Status and conclusions are yours to set. New evidence does not answer a
        question automatically.
      </p>
      <Button type="submit" variant="primary" disabled={action.busy}>
        Save question
      </Button>
      {action.status}
    </form>
  );
}
export function EvidenceLinkEditor({
  question,
  article,
  link,
  onSaved,
}: {
  question: Question;
  article: Article;
  link?: QuestionArticle;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(link?.note ?? ""),
    [disposition, setDisposition] = useState<QuestionArticle["disposition"]>(
      link?.disposition ?? "background",
    );
  const action = useResearchAction();
  return (
    <form
      className="space-y-3 rounded-lg border border-slate-700 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await linkQuestionArticle(
            question.id,
            article.id,
            { note, disposition, linked: true },
            link,
          );
          onSaved();
        });
      }}
    >
      <h3 className="font-semibold">
        <Link className="text-blue-300" to={`/articles/${article.id}`}>
          {article.title}
        </Link>{" "}
        &rarr;{" "}
        <Link
          className="text-blue-300"
          to={`/research?question=${question.id}`}
        >
          {question.title}
        </Link>
      </h3>
      <label className="block">
        Evidence relationship
        <select
          className={controlClass}
          value={disposition}
          onChange={(e) =>
            setDisposition(e.target.value as QuestionArticle["disposition"])
          }
        >
          <option value="supporting">Supporting</option>
          <option value="challenging">Challenging</option>
          <option value="background">Background</option>
        </select>
      </label>
      <Textarea
        label="Why this article matters to this question"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={action.busy}>
          {link?.linked ? "Save evidence link" : "Link article to question"}
        </Button>
        {link?.linked && (
          <Button
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                await linkQuestionArticle(
                  question.id,
                  article.id,
                  { linked: false },
                  link,
                );
                onSaved();
              })
            }
          >
            Unlink (keep note and citations)
          </Button>
        )}
      </div>
      {action.status}
    </form>
  );
}
export function ArticleNoteEditor({
  article,
  note,
  onSaved,
}: {
  article: Article;
  note?: ArticleNote;
  onSaved: () => void;
}) {
  const [body, setBody] = useState(note?.body ?? "");
  const action = useResearchAction();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await saveArticleNote(article.id, body, note);
          onSaved();
        });
      }}
    >
      <Textarea
        label="Article note (analyst commentary)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" disabled={action.busy}>
        Save article note
      </Button>
      {action.status}
    </form>
  );
}
export function FindingEditor({
  question,
  finding,
  data,
  onSaved,
}: {
  question: Question;
  finding?: Finding;
  data: ResearchData;
  onSaved: () => void;
}) {
  const [observed, setObserved] = useState(finding?.observed ?? ""),
    [interpretation, setInterpretation] = useState(
      finding?.interpretation ?? "",
    ),
    [uncertainties, setUncertainties] = useState(finding?.uncertainties ?? ""),
    [citations, setCitations] = useState(finding?.citations ?? []);
  const [request] = useState(() => crypto.randomUUID());
  const action = useResearchAction();
  const available = data.articles.filter((a) =>
    data.links.some(
      (l) => l.question_id === question.id && l.article_id === a.id && l.linked,
    ),
  );
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-700 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await saveFinding(
            question.id,
            { observed, interpretation, uncertainties, citations },
            finding,
            request,
          );
          onSaved();
        });
      }}
    >
      <h3 className="text-lg font-semibold">
        {finding ? "Edit finding" : "Draft a sourced finding"}
      </h3>
      <Textarea
        label="Observed claim / what the evidence says"
        value={observed}
        onChange={(e) => setObserved(e.target.value)}
      />
      <Textarea
        label="Analyst interpretation"
        value={interpretation}
        onChange={(e) => setInterpretation(e.target.value)}
      />
      <Textarea
        label="Open uncertainties"
        value={uncertainties}
        onChange={(e) => setUncertainties(e.target.value)}
      />
      <fieldset className="space-y-3">
        <legend>Cite linked evidence (optional for a draft)</legend>
        {!available.length && (
          <p>Link a Library article above to add a citation.</p>
        )}
        {available.map((a) => (
          <label key={a.id} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={citations.some((c) => c.id === a.id)}
              onChange={(e) =>
                setCitations((c) =>
                  e.target.checked
                    ? [...c, { id: a.id, title: a.title }]
                    : c.filter((v) => v.id !== a.id),
                )
              }
            />
            {a.title}
          </label>
        ))}
      </fieldset>
      {citations.map((c) => {
        const a = available.find((a) => a.id === c.id);
        return (
          <div key={c.id} className="space-y-2 border-l-2 border-blue-700 pl-3">
            <p>
              {c.title}{" "}
              {a ? (
                <Link className="text-blue-300" to={`/articles/${a.id}`}>
                  Inspect evidence
                </Link>
              ) : (
                <strong className="text-amber-200">
                  Evidence unavailable or unlinked; snapshot retained
                </strong>
              )}
            </p>
            <p className="text-sm text-slate-400">
              Article ID: {c.id}. Published: {c.published_at ?? "unknown"}.
              Citation captured: {c.captured_at ?? "on save"}.
              {c.passage_origin &&
                ` Passage from: ${c.passage_origin.origin} (${c.passage_origin.field}).`}
            </p>
            {a ? (
              <Textarea
                label={`Supporting passage for ${c.title} (must exist in available evidence)`}
                maxLength={2000}
                value={c.passage ?? ""}
                onChange={(e) =>
                  setCitations(
                    citations.map((v) =>
                      v.id === c.id ? { ...v, passage: e.target.value } : v,
                    ),
                  )
                }
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap">{c.passage}</p>
                <Button
                  onClick={() =>
                    setCitations(citations.filter((v) => v.id !== c.id))
                  }
                >
                  Remove unavailable citation from draft
                </Button>
              </>
            )}
          </div>
        );
      })}
      <Button type="submit" variant="primary" disabled={action.busy}>
        Save finding
      </Button>
      {action.status}
    </form>
  );
}
