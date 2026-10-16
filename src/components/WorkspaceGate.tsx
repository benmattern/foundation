import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { setActiveProject } from "../services/projectService";
import { type ReactNode, useEffect, useState } from "react";
import { getSession, observeAuth, signIn } from "../services/authService";
import { ProjectChooser } from "./ProjectChooser";

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
  return identity ? (
    <ProjectChooser key={identity}>{children}</ProjectChooser>
  ) : (
    <Login />
  );
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
        <Input
          label="Email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded bg-slate-800 p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded bg-slate-800 p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="primary"
          busy={busy}
          className="rounded bg-blue-700 p-3"
        >
          Sign in
        </Button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
