import { type ReactNode, useEffect, useState } from "react";
import {
  getSession,
  observeAuth,
  signIn,
  signOut,
} from "../services/authService";
import {
  getProjects,
  saveProject,
  setActiveProject,
} from "../services/projectService";
import type { Project } from "../types/project";

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<string | null | undefined>();
  useEffect(() => {
    let active = true;
    const load = () => {
      void getSession().then(({ data }) => {
        if (active) setIdentity(data.session?.user.id ?? null);
      });
    };
    load();
    const subscription = observeAuth(load);
    return () => {
      active = false;
      subscription.unsubscribe();
      setActiveProject(null);
    };
  }, []);
  if (identity === undefined) {
    return <p className="p-8 text-slate-300">Loading workspace…</p>;
  }
  return identity
    ? <ProjectGate key={identity}>{children}</ProjectGate>
    : <Login />;
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-md space-y-4 p-8 text-slate-200">
      <h1 className="text-2xl">FOUNDATION</h1>
      <p>Sign in to your private research workspace.</p>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await signIn(email, password);
          } catch (error) {
            setError(String(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          aria-label="Email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded bg-slate-800 p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          aria-label="Password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded bg-slate-800 p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={busy} className="rounded bg-blue-700 p-3">
          Sign in
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
function ProjectGate({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  function choose(id: string) {
    setActiveProject(id || null);
    setSelected(id);
    localStorage.setItem("foundation.project", id);
  }
  useEffect(() => {
    let active = true;
    getProjects().then((data) => {
      if (!active) return;
      setProjects(data);
      const remembered = localStorage.getItem("foundation.project");
      const project = data.find((p) => p.id === remembered) ?? data.find((p) =>
        !p.archived
      ) ?? data[0];
      if (project) choose(project.id);
      setReady(true);
    }).catch((error: unknown) => {
      if (active) {
        setError(String(error));
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-950 p-3 text-slate-200">
        <label>
          Project{" "}
          <select
            aria-label="Active project"
            value={selected}
            onChange={(e) => choose(e.target.value)}
            className="rounded bg-slate-800 p-2"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const project = await saveProject({ name });
              setProjects((list) => [...list, project]);
              choose(project.id);
              setName("");
            } catch (error) {
              setError(String(error));
            }
          }}
        >
          <input
            aria-label="New project name"
            placeholder="New project name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded bg-slate-800 p-2"
          />
          <button>Create project</button>
        </form>
        <button onClick={() => void signOut()}>Sign out</button>
        {error && <p role="alert" className="text-red-300">{error}</p>}
      </div>
      {selected && ready
        ? <div key={selected}>{children}</div>
        : (
          <p className="p-8 text-slate-300">
            {ready
              ? "Create or select a research project."
              : "Loading projects…"}
          </p>
        )}
    </>
  );
}
