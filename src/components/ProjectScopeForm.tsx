import { useRef, useState } from "react";
import type { Project } from "../types/project";
import { saveProject } from "../services/projectService";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
export function ProjectScopeForm({
  project,
  onSaved,
}: {
  project: Project;
  onSaved: (project: Project) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  return (
    <form
      className="max-w-3xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (locked.current) return;
        const form = new FormData(event.currentTarget);
        const name = String(form.get("name")).trim();
        if (!name) {
          setError("Enter a project name.");
          return;
        }
        locked.current = true;
        setBusy(true);
        setError("");
        try {
          onSaved(
            await saveProject(
              {
                name,
                description: String(form.get("description")),
                topics: String(form.get("topics"))
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                keywords: String(form.get("keywords"))
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              },
              project.id,
            ),
          );
          window.dispatchEvent(new Event("foundation:project-updated"));
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Save failed. Your entries are preserved.",
          );
        } finally {
          locked.current = false;
          setBusy(false);
        }
      }}
    >
      <Input
        label="Project name"
        name="name"
        required
        defaultValue={project.name}
      />
      <Textarea
        label="Description"
        name="description"
        defaultValue={project.description}
      />
      <Input
        label="Topics, separated by commas"
        name="topics"
        defaultValue={project.topics.join(", ")}
      />
      <Textarea
        label="Research keywords, separated by commas"
        name="keywords"
        defaultValue={project.keywords.join(", ")}
        hint="Scope metadata describes your research. It does not filter incoming items. Configure matching terms in advanced rules if needed."
      />
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" busy={busy}>
          Save project
        </Button>
        <Button type="reset" disabled={busy}>
          Cancel edits
        </Button>
      </div>
    </form>
  );
}
