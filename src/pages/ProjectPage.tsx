import { ProjectScopeForm } from "../components/ProjectScopeForm";
import { Button } from "../components/ui/Button";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { candidateEvidence } from "../lib/candidateRules";
import { RuleEditor } from "../components/RuleEditor";
import {
  activeProjectId,
  getProjects,
  saveProject,
} from "../services/projectService";
import { getTags } from "../services/tagService";
import { queryCandidates } from "../services/ingestionCandidateService";
import { reapplyRules, saveProjectRules } from "../services/ruleService";
import {
  classifyItem,
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
    const { candidates } = await queryCandidates({
      status: "pending",
      page: 0,
    });
    setPreview(
      candidates.slice(0, 20).map((candidate) => {
        const result = classifyItem(
          candidateEvidence(candidate),
          rules,
          new Date().toISOString(),
        );
        return `${candidate.title || candidate.url}: ${result.route.replaceAll(
          "_",
          " ",
        )} (${
          result.matches
            .map((m) => `${m.kind}: ${m.term} in ${m.field}`)
            .join("; ") || "default rule"
        })`;
      }),
    );
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
          <details className="max-w-3xl rounded-xl border border-slate-700 p-4">
            <summary>Advanced matching rules</summary>
            <RuleEditor
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
