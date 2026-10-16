import { useEffect, useState } from "react";
import { candidateEvidence } from "../lib/candidateRules";
import {
  activeProjectId,
  getProjects,
  getSubscriptions,
  saveSubscription,
} from "../services/projectService";
import { getTags } from "../services/tagService";
import {
  type CollectionRun,
  getCollectionRuns,
} from "../services/rssFeedService";
import { queryCandidates } from "../services/ingestionCandidateService";
import { RuleEditor } from "./RuleEditor";
import {
  classifyItem,
  inheritRules,
} from "../../supabase/functions/_shared/rules";
import type { RssFeed } from "../types/rssFeed";
import type { Project, Subscription } from "../types/project";
import type { Tag } from "../types/tag";

export function Subscriptions({
  feeds,
  revision,
  onChanged,
}: {
  feeds: RssFeed[];
  revision: unknown;
  onChanged?: () => Promise<void>;
}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [runs, setRuns] = useState<CollectionRun[]>([]);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([
      getSubscriptions(),
      getProjects(),
      getTags(),
      getCollectionRuns(),
    ])
      .then(([subs, projects, tags, runs]) => {
        if (active) {
          setSubscriptions(subs);
          setProject(projects.find((p) => p.id === activeProjectId()) ?? null);
          setTags(tags);
          setRuns(runs);
        }
      })
      .catch((error) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  async function save(
    feed: RssFeed,
    enabled: boolean,
    rules: Subscription["rules"],
  ) {
    await saveSubscription(
      feed.id,
      enabled,
      rules,
      subscriptions.find((s) => s.feed_id === feed.id)?.rules ?? null,
    );
    setSubscriptions((current) => [
      ...current.filter((s) => s.feed_id !== feed.id),
      {
        project_id: activeProjectId(),
        feed_id: feed.id,
        enabled,
        rules,
      },
    ]);
    await onChanged?.();
  }
  return (
    <section className="space-y-4 rounded border border-slate-700 p-4 text-slate-300">
      <h2 className="text-xl">Project feed rules</h2>
      <p>
        These switches affect this project's intake. Feed availability settings
        apply across your projects. Re-enabling collects the publisher's current
        window.
      </p>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {project &&
        feeds.map((feed) => {
          const subscription = subscriptions.find((s) => s.feed_id === feed.id);
          const latest = runs.find((r) => r.feed_id === feed.id);
          return (
            <div
              key={feed.id}
              className="space-y-2 border-t border-slate-700 pt-3"
            >
              <label>
                <input
                  type="checkbox"
                  checked={subscription?.enabled ?? false}
                  disabled={project.archived}
                  onChange={(e) =>
                    void save(
                      feed,
                      e.target.checked,
                      subscription?.rules ?? null,
                    ).catch((error) => setError(String(error)))
                  }
                />{" "}
                {feed.title || feed.feed_url}
              </label>
              <p className="text-sm">
                {subscription?.enabled && !project.archived
                  ? "Enabled"
                  : "Paused"}{" "}
                · Latest run: {latest?.status ?? "Never checked"} · Last
                attempt:{" "}
                {feed.last_checked_at
                  ? new Date(feed.last_checked_at).toLocaleString()
                  : "Never"}{" "}
                · Last success:{" "}
                {feed.last_success_at
                  ? new Date(feed.last_success_at).toLocaleString()
                  : "Never"}
              </p>
              <details>
                <summary>Rules for this feed</summary>
                <p>
                  {subscription?.rules
                    ? "Explicit override (empty lists override defaults)"
                    : "Inherits project defaults"}
                </p>
                {subscription?.rules && (
                  <button
                    onClick={() =>
                      void save(feed, subscription.enabled, null).catch(
                        (error) => setError(String(error)),
                      )
                    }
                  >
                    Use project defaults
                  </button>
                )}
                <RuleEditor
                  initial={inheritRules(
                    project.rules,
                    subscription?.rules ?? {},
                  )}
                  tags={tags}
                  onSave={async (rules) =>
                    save(feed, subscription?.enabled ?? false, rules)
                  }
                  onPreview={async (rules) => {
                    const { candidates } = await queryCandidates({
                      status: "pending",
                      page: 0,
                    });
                    setPreview(
                      candidates
                        .filter((c) => c.raw_metadata.feed_id === feed.id)
                        .slice(0, 20)
                        .map(
                          (c) =>
                            `${c.title || c.url}: ${
                              classifyItem(
                                candidateEvidence(c),
                                rules,
                                new Date().toISOString(),
                              ).route
                            }`,
                        ),
                    );
                  }}
                />
              </details>
            </div>
          );
        })}
      <ul>
        {preview.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <details>
        <summary>Recent collection details for these feeds</summary>
        <ul className="space-y-2">
          {runs
            .filter((run) => feeds.some((f) => f.id === run.feed_id))
            .map((run) => (
              <li key={run.id}>
                {feeds.find((f) => f.id === run.feed_id)?.title || run.feed_id}{" "}
                · {new Date(run.started_at).toLocaleString()} · {run.status} ·{" "}
                {run.fetched} processed / {run.staged} staged {run.error}{" "}
                {run.warnings.join("; ")}
              </li>
            ))}
        </ul>
      </details>
    </section>
  );
}
