import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { EntityEditor } from "../components/ResearchEditors";
import { useResearchData } from "../lib/useResearchData";
import { coverage } from "../lib/research";
import { normalizeRuleText } from "../../supabase/functions/_shared/rules";

export default function EntitiesPage() {
  const { data, error, refresh } = useResearchData();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [message, setMessage] = useState("");
  const entity = data?.entities.find((e) => e.id === params.get("entity"));
  const counts =
    entity && data ? coverage(entity.id, data.mentions, data.articles) : null;
  const collisions =
    entity && data
      ? data.entities.filter(
          (e) =>
            e.id !== entity.id &&
            [e.name, ...e.aliases].some((alias) =>
              [entity.name, ...entity.aliases].some(
                (a) => normalizeRuleText(a) === normalizeRuleText(alias),
              ),
            ),
        )
      : [];
  return (
    <section className="space-y-6">
      <PageHeader
        title="Entities"
        description="Known people, organizations and places. Confirmed associations stay within this project."
      />
      {error && (
        <p role="alert">
          {error} <Button onClick={refresh}>Retry entities</Button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!data && !error && <p role="status">Loading entities...</p>}
      {data && (
        <div className="grid items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Input
              label="Search identities and aliases"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={() => setParams({})}>Create entity</Button>
            <ul className="space-y-3">
              {data.entities
                .filter((e) =>
                  [e.name, ...e.aliases, e.description]
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((e) => (
                  <li
                    className="rounded-lg border border-slate-700 p-3"
                    key={e.id}
                  >
                    <Link
                      className="text-blue-300"
                      to={`/entities?entity=${e.id}`}
                    >
                      {e.name}
                    </Link>
                    <p>
                      {e.entity_type} - {e.description}
                    </p>
                  </li>
                ))}
            </ul>
            {!data.entities.length && (
              <p>
                Create a known identity, then link it from an article or preview
                name suggestions.
              </p>
            )}
          </aside>
          <div className="min-w-0 space-y-6">
            {params.get("entity") && !entity ? (
              <p role="status">
                Identity unavailable or loading. Choose an identity from your
                registry.
              </p>
            ) : (
              <EntityEditor
                key={entity ? `${entity.id}:${entity.version}` : "new"}
                entity={entity}
                onSaved={(e) => {
                  setParams({ entity: e.id });
                  setMessage(
                    "Identity saved. Existing mentions retain their evidence and review states. Rescan explicitly from an article to preview new alias matches.",
                  );
                  refresh();
                }}
              />
            )}
            {!!collisions.length && (
              <p className="rounded-lg border border-amber-800 p-4">
                Overlapping names/aliases:{" "}
                {collisions
                  .map((e) => `${e.name} (${e.entity_type}: ${e.description})`)
                  .join("; ")}
                . These are distinct identities; review ambiguity manually.
              </p>
            )}
            {entity && counts && (
              <>
                <h2 className="text-2xl font-semibold">
                  Confirmed project coverage
                </h2>
                <p>
                  {counts.acquisitions} deduplicated acquisitions in{" "}
                  {counts.articles.length} article records, from{" "}
                  {counts.sourceRecords} source/collector records;{" "}
                  {counts.unknownSources} article records have unknown source.
                  Original publisher count is not established. Feed labels can
                  describe aggregators.
                </p>
                <p className="text-sm text-slate-400">
                  Coverage counts include confirmed/manual links only. Repeated
                  or syndicated reports are not independent corroboration.
                </p>
                {counts.articles.map((a) => (
                  <article
                    className="space-y-2 rounded-xl border border-slate-700 p-4"
                    key={a.id}
                  >
                    <h3>
                      <Link className="text-blue-300" to={`/articles/${a.id}`}>
                        {a.title}
                      </Link>
                    </h3>
                    <p>
                      Source/collector:{" "}
                      {data.sources.find((s) => s.id === a.source_id)?.name ??
                        "Unknown"}
                      ; published {a.published_at ?? "unknown"}
                    </p>
                    {data.mentions
                      .filter(
                        (m) =>
                          m.entity_id === entity.id &&
                          m.article_id === a.id &&
                          m.state === "confirmed",
                      )
                      .map((m) => (
                        <details key={m.id}>
                          <summary>
                            {m.manual
                              ? "Manual association"
                              : `Confirmed alias: ${m.matched_alias}`}{" "}
                            - {m.source_field}
                          </summary>
                          <p className="whitespace-pre-wrap">
                            {m.snapshot ||
                              "No passage supplied; manual identity association."}
                          </p>
                        </details>
                      ))}
                    <ul>
                      {data.questions
                        .filter((q) =>
                          data.links.some(
                            (l) =>
                              l.question_id === q.id &&
                              l.article_id === a.id &&
                              l.linked,
                          ),
                        )
                        .map((q) => (
                          <li key={q.id}>
                            <Link
                              className="text-blue-300"
                              to={`/research?question=${q.id}`}
                            >
                              {q.title}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </article>
                ))}
                {!counts.articles.length && (
                  <p>
                    No confirmed articles in this project. Open a Library
                    article to link this identity.
                  </p>
                )}
                <details>
                  <summary>Unavailable article associations</summary>
                  {data.mentions
                    .filter((m) => m.entity_id === entity.id && !m.article_id)
                    .map((m) => (
                      <p key={m.id}>
                        {m.article_snapshot.title}: unavailable; {m.state}{" "}
                        snapshot retained.
                      </p>
                    ))}
                </details>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
