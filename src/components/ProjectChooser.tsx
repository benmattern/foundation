import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProjects,
  saveProject,
  setActiveProject,
} from "../services/projectService";
import { signOut } from "../services/authService";
import type { Project } from "../types/project";
import { Button } from "./ui/Button";
import { Input, controlClass } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Dialog } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";

export function ProjectChooser({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  function choose(id: string) {
    setActiveProject(id || null);
    setSelected(id);
    localStorage.setItem("foundation.project", id);
  }
  useEffect(() => {
    let active = true;
    getProjects()
      .then((data) => {
        if (!active) return;
        setProjects(data);
        const remembered = localStorage.getItem("foundation.project");
        const project =
          data.find((p) => p.id === remembered) ??
          data.find((p) => !p.archived) ??
          data[0];
        if (project) {
          setActiveProject(project.id);
          setSelected(project.id);
        }
        setReady(true);
      })
      .catch((error: unknown) => {
        if (active) {
          setError(String(error));
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      void getProjects()
        .then(setProjects)
        .catch((error: unknown) => setError(String(error)));
    };
    window.addEventListener("foundation:project-updated", refresh);
    return () =>
      window.removeEventListener("foundation:project-updated", refresh);
  }, []);
  return (
    <>
      <header className="flex flex-wrap items-end gap-3 border-b border-slate-700 bg-slate-950 p-4 text-slate-200 sm:px-8">
        <div className="w-full min-w-0 space-y-1 sm:w-72">
          <label htmlFor="active-project" className="text-sm text-slate-400">
            Research project
          </label>
          <select
            id="active-project"
            aria-label="Active project"
            value={selected}
            onChange={(event) => {
              choose(event.target.value);
              navigate("/");
            }}
            className={controlClass}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setCreating(true)}>New project</Button>
        <Button
          className="sm:ml-auto"
          onClick={() =>
            void signOut().catch((error: unknown) => setError(String(error)))
          }
        >
          Sign out
        </Button>
        {error && (
          <p role="alert" className="w-full text-red-300">
            {error}
          </p>
        )}
      </header>
      {creating && (
        <NewProject
          onCancel={() => setCreating(false)}
          onCreated={(project) => {
            setProjects((list) => [...list, project]);
            choose(project.id);
            setCreating(false);
            navigate("/");
          }}
        />
      )}
      {selected && ready ? (
        <div key={selected}>{children}</div>
      ) : (
        <main className="mx-auto max-w-3xl p-6">
          {ready ? (
            <EmptyState
              title="Start your research project"
              action={
                <Button variant="primary" onClick={() => setCreating(true)}>
                  New project
                </Button>
              }
            >
              Give your research a name, then choose sources or capture a link.
              No rules or AI setup required.
            </EmptyState>
          ) : (
            <p>Loading projects…</p>
          )}
        </main>
      )}
    </>
  );
}
function NewProject({
  onCreated,
  onCancel,
}: {
  onCreated: (project: Project) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  return (
    <Dialog title="New project" onClose={onCancel} busy={busy}>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (locked.current) return;
          const data = new FormData(event.currentTarget);
          const name = String(data.get("name")).trim();
          if (!name) {
            setError("Enter a project name.");
            return;
          }
          locked.current = true;
          setBusy(true);
          setError("");
          try {
            onCreated(
              await saveProject({
                name,
                description: String(data.get("description") ?? ""),
                topics: String(data.get("topics") ?? "")
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                keywords: String(data.get("keywords") ?? "")
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              }),
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Project could not be saved. Your entries are preserved.",
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
          autoFocus
          required
          hint="For example: Pacific supply chains"
        />
        <details>
          <summary>Optional research scope</summary>
          <div className="space-y-4 pt-3">
            <Textarea label="Description" name="description" />
            <Input label="Topics, separated by commas" name="topics" />
            <Textarea
              label="Research keywords, separated by commas"
              name="keywords"
            />
            <p className="text-sm text-slate-400">
              These describe your research. They do not filter incoming items.
              You can add matching rules in Project settings later.
            </p>
          </div>
        </details>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" busy={busy}>
            Create project
          </Button>
          <Button disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
