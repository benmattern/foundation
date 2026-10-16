import { useResearchAction } from "../lib/useResearchAction";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  QuestionEditor,
  EvidenceLinkEditor,
  FindingEditor,
} from "../components/ResearchEditors";
import { useResearchData } from "../lib/useResearchData";
import { linkQuestionArticle } from "../services/researchService";

export default function ResearchPage() {
  const { data, error, refresh } = useResearchData();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [articleSearch, setArticleSearch] = useState(""),
    [selected, setSelected] = useState<string[]>(
      () => params.get("articles")?.split(",").filter(Boolean) ?? [],
    ),
    [message, setMessage] = useState("");
  const action = useResearchAction();
  const question = data?.questions.find((q) => q.id === params.get("question"));
  async function batch(questionId: string) {
    if (!data) return;
    const outcomes: string[] = [];
    for (const id of selected) {
      try {
        const prior = data.links.find(
          (l) => l.question_id === questionId && l.article_id === id,
        );
        if (!prior?.linked)
          await linkQuestionArticle(questionId, id, { linked: true }, prior);
      } catch (e) {
        outcomes.push(
          `${data.articles.find((a) => a.id === id)?.title ?? id}: ${String(e)}`,
        );
      }
    }
    setMessage(
      outcomes.length
        ? `Some links failed; selection preserved. ${outcomes.join("; ")}`
        : `Linked ${selected.length} selected articles.`,
    );
    if (!outcomes.length) setSelected([]);
    refresh();
  }
  return (
    <section className="space-y-6">
      <PageHeader
        title="Research"
        description="Investigate questions, connect evidence and record your reasoning."
      />
      {error && (
        <p role="alert">
          {error} <Button onClick={refresh}>Retry research</Button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!data && !error && <p role="status">Loading research...</p>}
      {data && (
        <div className="grid items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Input
              label="Search questions"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={() => setParams({})}>
              Create research question
            </Button>
            {!data.questions.length && (
              <p>Start with a question, then link kept Library articles.</p>
            )}
            <ul className="space-y-2">
              {data.questions
                .filter((q) =>
                  (q.title + " " + q.description)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((q) => (
                  <li
                    className="rounded-lg border border-slate-700 p-3"
                    key={q.id}
                  >
                    <Link
                      className="text-blue-300"
                      to={`/research?question=${q.id}`}
                    >
                      {q.title}
                    </Link>
                    <p className="text-sm">
                      {q.status} -{" "}
                      {
                        data.links.filter(
                          (l) =>
                            l.question_id === q.id && l.linked && l.article_id,
                        ).length
                      }{" "}
                      linked articles
                    </p>
                  </li>
                ))}
            </ul>
            <Link className="block text-blue-300" to="/entities">
              Browse people, organizations and places
            </Link>
          </aside>
          <div className="min-w-0 space-y-6">
            {params.get("question") && !question ? (
              <p role="status">
                Question unavailable or loading. Choose a question from this
                project.
              </p>
            ) : (
              <QuestionEditor
                key={question ? `${question.id}:${question.version}` : "new"}
                question={question}
                onSaved={(q) => {
                  setParams({ question: q.id });
                  setMessage("Question saved.");
                  refresh();
                  if (selected.length) void action.run(() => batch(q.id));
                }}
              />
            )}
            {question && (
              <>
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">
                    Evidence for this question
                  </h2>
                  <Input
                    label="Search Library evidence"
                    type="search"
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                  />
                  <fieldset className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-700 p-4">
                    <legend>Select Library articles to link</legend>
                    {data.articles
                      .filter((a) =>
                        a.title
                          .toLowerCase()
                          .includes(articleSearch.toLowerCase()),
                      )
                      .map((a) => (
                        <label
                          key={a.id}
                          className="flex min-h-11 items-center gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(a.id)}
                            onChange={(e) =>
                              setSelected((s) =>
                                e.target.checked
                                  ? [...s, a.id]
                                  : s.filter((id) => id !== a.id),
                              )
                            }
                          />
                          {a.title}
                        </label>
                      ))}
                  </fieldset>
                  <Button
                    disabled={action.busy || !selected.length}
                    onClick={() => void action.run(() => batch(question.id))}
                  >
                    Link selected articles ({selected.length})
                  </Button>
                  {action.status}
                  {data.links
                    .filter((l) => l.question_id === question.id)
                    .map((l) => {
                      const article = data.articles.find(
                        (a) => a.id === l.article_id,
                      );
                      return article ? (
                        <details key={`${l.id}:${l.version}`} open={l.linked}>
                          <summary>
                            {article.title} -{" "}
                            {l.linked
                              ? l.disposition
                              : "Unlinked; note retained"}
                          </summary>
                          <EvidenceLinkEditor
                            article={article}
                            question={question}
                            link={l}
                            onSaved={refresh}
                          />
                        </details>
                      ) : (
                        <div
                          key={l.id}
                          className="rounded-lg border border-amber-900 p-4"
                        >
                          <p>
                            {l.article_snapshot.title}: article unavailable;
                            citation snapshot and link note retained.
                          </p>
                          <p>{l.note}</p>
                        </div>
                      );
                    })}
                </section>
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">Findings</h2>
                  {data.findings
                    .filter((f) => f.question_id === question.id)
                    .map((f) => (
                      <details key={`${f.id}:${f.version}`}>
                        <summary>
                          {f.observed.slice(0, 100) || "Draft finding"}
                        </summary>
                        <FindingEditor
                          data={data}
                          question={question}
                          finding={f}
                          onSaved={refresh}
                        />
                      </details>
                    ))}
                  <FindingEditor
                    key={`${question.id}:new:${data.findings.length}`}
                    data={data}
                    question={question}
                    onSaved={() => {
                      setMessage("Finding saved. Reopen it above to edit.");
                      refresh();
                    }}
                  />
                </section>
                <section>
                  <h2 className="text-xl font-semibold">
                    Event context from linked articles
                  </h2>
                  <ul>
                    {data.events
                      .filter((e) =>
                        data.eventLinks.some(
                          (el) =>
                            el.event_id === e.id &&
                            data.links.some(
                              (l) =>
                                l.question_id === question.id &&
                                l.linked &&
                                l.article_id === el.article_id,
                            ),
                        ),
                      )
                      .map((e) => (
                        <li key={e.id}>
                          <Link
                            className="text-blue-300"
                            to={`/events/${e.id}`}
                          >
                            {e.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                  <p className="text-sm text-slate-400">
                    Events remain separate records; entity mentions do not
                    establish event identity.
                  </p>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
