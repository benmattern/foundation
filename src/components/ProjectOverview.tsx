import { getArticleCount } from "../services/articleService";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProjects,
  activeProjectId,
  getSubscriptions,
} from "../services/projectService";
import { getRssFeeds, getCollectionRuns } from "../services/rssFeedService";
import { queryCandidates } from "../services/ingestionCandidateService";
import {
  overviewState,
  projectFeeds,
  feedHealth,
} from "../lib/projectWorkflow";
import { Button } from "./ui/Button";
import { buttonClass } from "./ui/buttonStyles";
import { EmptyState } from "./ui/EmptyState";
import { PageHeader } from "./PageHeader";
import type { Project } from "../types/project";
import { ContinueResearch } from "./ContinueResearch";

export function ProjectOverview() {
  const [data, setData] = useState<{
    project?: Project;
    enabled: number;
    sources: number;
    pending: number;
    outside: number;
    kept: number;
    checked: boolean;
    failed: boolean;
    running: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const id = activeProjectId();
    Promise.all([
      getProjects(),
      getSubscriptions(),
      getRssFeeds(),
      getCollectionRuns(),
      queryCandidates({ status: "pending", route: "pending", page: 0 }),
      queryCandidates({ status: "pending", route: "outside_scope", page: 0 }),
      getArticleCount(),
    ])
      .then(([projects, subs, feeds, runs, pending, outside, articles]) => {
        if (!active) return;
        const enabled = projectFeeds(feeds, subs);
        const health = enabled.map((feed) => feedHealth(feed, runs));
        setData({
          project: projects.find((p) => p.id === id),
          enabled: enabled.length,
          sources: new Set(enabled.map((f) => f.source_id).filter(Boolean))
            .size,
          pending: pending.count,
          outside: outside.count,
          kept: articles,
          checked: enabled.some((f) => !!f.last_checked_at),
          failed: health.some((h) => h.kind === "error"),
          running: health.some((h) => h.kind === "running"),
        });
        setError("");
      })
      .catch((error: unknown) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const state = data
    ? overviewState({ ...data, archived: data.project?.archived })
    : null;
  return (
    <section className="mb-8 space-y-5">
      <PageHeader
        title={data?.project?.name ?? "Project overview"}
        description={
          data?.project?.description ||
          "Choose sources, review incoming research, and build your library."
        }
      />
      <ContinueResearch />
      {error ? (
        <EmptyState
          title="Overview could not load"
          action={
            <Button onClick={() => setRevision((n) => n + 1)}>
              Retry overview
            </Button>
          }
        >
          {error}
        </EmptyState>
      ) : !data || !state ? (
        <p role="status">Loading project progress…</p>
      ) : (
        <>
          <p className="mb-4 text-slate-300">
            Intake:{" "}
            {data.project?.rules.format === 2
              ? data.project.rules.mode
              : data.project?.rules.includeAny.length
                ? "restricted (legacy substring)"
                : "all incoming"}
            .{" "}
            <Link className="text-blue-300" to="/project#relevance-rules">
              Edit relevance rules
            </Link>
          </p>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              ["Enabled sources", data.sources],
              ["Enabled feeds", data.enabled],
              ["Awaiting review", data.pending],
              ["Kept articles", data.kept],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-700 bg-slate-900 p-4"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <EmptyState
            title={state.title}
            action={
              <>
                <Link className={buttonClass("primary")} to={state.to}>
                  {state.action}
                </Link>
                <Link className={buttonClass()} to="/articles?capture=1">
                  Capture a link
                </Link>
                {data.kept > 0 && (
                  <Link className={buttonClass()} to="/research">
                    Investigate a research question
                  </Link>
                )}
                <Button onClick={() => setRevision((n) => n + 1)}>
                  Refresh progress
                </Button>
              </>
            }
          >
            {state.detail}
          </EmptyState>
          <details className="rounded-xl border border-slate-700 px-4">
            <summary>Your research workflow</summary>
            <ol className="grid gap-4 pb-4 text-sm sm:grid-cols-3">
              <li>
                <Link to="/sources" className="text-blue-300">
                  1. Choose sources
                </Link>
                <p>
                  {data.enabled
                    ? `${data.enabled} feeds enabled for this project.`
                    : "Enable a feed, or capture a link manually."}
                </p>
              </li>
              <li>
                <Link to="/ingestion" className="text-blue-300">
                  2. Review inbox
                </Link>
                <p>
                  {data.pending} awaiting review. Keeping is always your
                  decision.
                </p>
              </li>
              <li>
                <Link to="/articles" className="text-blue-300">
                  3. Build library
                </Link>
                <p>
                  {data.kept} kept articles. Add tags, notes and optional event
                  links.
                </p>
              </li>
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
