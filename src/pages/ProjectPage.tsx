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
  useEffect(() => {
    let active = true;
    Promise.all([getProjects(), getTags()]).then(([projects, tags]) => {
      if (active) {
        setProject(projects.find((p) => p.id === activeProjectId()) ?? null);
        setTags(tags);
      }
    }).catch((error) => {
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
        return `${candidate.title || candidate.url}: ${
          result.route.replaceAll("_", " ")
        } (${
          result.matches.map((m) => `${m.kind}: ${m.term} in ${m.field}`).join(
            "; ",
          ) || "default rule"
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
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {project && (
        <div className="space-y-6 text-slate-300">
          <form
            key={JSON.stringify([
              project.name,
              project.description,
              project.topics,
              project.keywords,
            ])}
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              try {
                setProject(
                  await saveProject({
                    name: String(form.get("name")),
                    description: String(form.get("description")),
                    topics: String(form.get("topics")).split(",").map((t) =>
                      t.trim()
                    ).filter(Boolean),
                    keywords: String(form.get("keywords")).split(",").map((t) =>
                      t.trim()
                    ).filter(Boolean),
                  }, project.id),
                );
              } catch (error) {
                setError(String(error));
              }
            }}
          >
            <label className="block">
              Name<input
                name="name"
                required
                defaultValue={project.name}
                className="ml-2 bg-slate-800 p-2"
              />
            </label>
            <label className="block">
              Description<textarea
                name="description"
                defaultValue={project.description}
                className="ml-2 bg-slate-800 p-2"
              />
            </label>
            <label className="block">
              Topics, separated by commas<input
                name="topics"
                defaultValue={project.topics.join(", ")}
                className="ml-2 bg-slate-800 p-2"
              />
            </label>
            <label className="block">
              Research keywords, separated by commas<input
                name="keywords"
                defaultValue={project.keywords.join(", ")}
                className="ml-2 bg-slate-800 p-2"
              />
            </label>
            <p>
              Topics and research keywords describe the project. Configure
              matching terms below to filter intake.
            </p>
            <button>Save project</button>
          </form>
          <button
            onClick={() =>
              void saveProject({ archived: !project.archived }, project.id)
                .then(setProject).catch((error) => setError(String(error)))}
          >
            {project.archived
              ? "Reopen project"
              : "Archive project and pause intake"}
          </button>
          <RuleEditor
            initial={project.rules}
            tags={tags}
            onPreview={previewRules}
            onSave={async (rules) => {
              await saveProjectRules(rules, project.rules);
              setProject({ ...project, rules });
            }}
          />
          <button
            onClick={() =>
              void reapplyRules().then((count) =>
                setPreview([
                  `Reapplied saved rules to ${count} pending candidates; analyst tags and decisions preserved.`,
                ])
              ).catch((error) => setError(String(error)))}
          >
            Reapply saved rules to pending candidates
          </button>
          <p>
            Preview shows up to 20 recent pending items. Rule changes and
            reapplication preserve analyst edits.
          </p>
          <ul>{preview.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </div>
      )}
    </>
  );
}
