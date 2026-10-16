import { ProjectScopeForm } from "../components/ProjectScopeForm";
import { Button } from "../components/ui/Button";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { candidateEvidence } from "../lib/candidateRules";
import { RuleEditor } from "../components/RuleEditor";
import {
  activeProjectId,
  getProjects,
  getSubscriptions,
  saveProject,
} from "../services/projectService";
import { getTags } from "../services/tagService";
import { queryCandidates } from "../services/ingestionCandidateService";
import { reapplyRules, saveProjectRules } from "../services/ruleService";
import {
  classifyItem,
  inheritRules,
  type Rules,
} from "../../supabase/functions/_shared/rules";
import type { Project } from "../types/project";
import type { Tag } from "../types/tag";

export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getProjects(), getTags()])
      .then(([projects, tags]) => {
        if (active) {
          setProject(projects.find((p) => p.id === activeProjectId()) ?? null);
          setTags(tags);
        }
      })
      .catch((error) => {
        if (active) setError(String(error));
      });
    return () => {
      active = false;
    };
  }, []);
  async function previewRules(rules: Rules) {
    const [{ candidates }, subscriptions] = await Promise.all([
      queryCandidates({
        status: "pending",
        page: 0,
      }),
      getSubscriptions(),
    ]);
    const effective = (candidate: (typeof candidates)[number]) =>
      inheritRules(
        rules,
        subscriptions.find((s) => s.feed_id === candidate.raw_metadata.feed_id)
          ?.rules ?? {},
      );
    if (!candidates.length) {
      setPreview([
        "Insufficient preview data. Collect or capture items first; rules can still be saved now.",
      ]);
      return;
    }
    const results = candidates
      .slice(0, 20)
      .map((c) =>
        classifyItem(
          candidateEvidence(c),
          effective(c),
          new Date().toISOString(),
        ),
      );
    setPreview([
      `Sample: ${results.length} items; ${results.filter((r) => r.route === "pending").length} included; ${results.filter((r) => r.route === "outside_scope").length} outside scope; ${results.filter((r) => r.warnings.length).length} missing text. These are sample counts only.`,
      ...candidates.slice(0, 20).map((candidate) => {
        const result = classifyItem(
          candidateEvidence(candidate),
          effective(candidate),
          new Date().toISOString(),
        );
        return `${candidate.title || candidate.url}: ${result.route.replaceAll(
          "_",
          " ",
        )} (${
          result.matches
            .map(
              (m) =>
                `${m.kind}: ${m.term} in ${m.field}${m.passage ? `: ${m.passage}` : ""}`,
            )
            .join("; ") || "default rule"
        }). ${subscriptions.some((s) => s.feed_id === candidate.raw_metadata.feed_id && s.rules) ? "Feed override applied to project draft." : "Project draft defaults."}`;
      }),
    ]);
  }
  return (
    <>
      <PageHeader
        title="Project settings"
        description="Private research scope and deterministic intake rules."
      />
      {message && (
        <p role="status" className="mb-4 text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {project && (
        <div className="space-y-6 text-slate-300">
          <ProjectScopeForm
            key={JSON.stringify([
              project.id,
              project.name,
              project.description,
              project.topics,
              project.keywords,
            ])}
            project={project}
            onSaved={(p) => {
              setProject(p);
              setMessage("Project scope saved.");
            }}
          />

          <Button
            onClick={() =>
              void saveProject({ archived: !project.archived }, project.id)
                .then((p) => {
                  setProject(p);
                  window.dispatchEvent(new Event("foundation:project-updated"));
                })
                .catch((error) => setError(String(error)))
            }
          >
            {project.archived
              ? "Reopen project"
              : "Archive project and pause intake"}
          </Button>
          <p>
            Collection mode:{" "}
            {project.rules.format === 2
              ? project.rules.mode
              : project.rules.includeAny.length
                ? "restricted (legacy substring)"
                : "all incoming items; no inclusion filter"}
            .{" "}
            <a href="#relevance-rules" className="text-blue-300">
              Edit relevance rules
            </a>
          </p>
          <details
            open
            id="relevance-rules"
            className="max-w-3xl rounded-xl border border-slate-700 p-4"
          >
            <summary>Relevance rules and sample preview</summary>
            <RuleEditor
              scopeTerms={[...project.topics, ...project.keywords]}
              initial={project.rules}
              tags={tags}
              onPreview={previewRules}
              onSave={async (rules) => {
                await saveProjectRules(rules, project.rules);
                setProject({ ...project, rules });
              }}
            />
            <Button
              onClick={() =>
                void reapplyRules()
                  .then((count) =>
                    setPreview([
                      `Reapplied saved rules to ${count} pending candidates; analyst tags and decisions preserved.`,
                    ]),
                  )
                  .catch((error) => setError(String(error)))
              }
            >
              Reapply saved rules to pending candidates
            </Button>
            <p>
              Preview shows up to 20 recent pending items. Rule changes and
              reapplication preserve analyst edits.
            </p>
            <ul className="space-y-2">
              {preview.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </>
  );
}
