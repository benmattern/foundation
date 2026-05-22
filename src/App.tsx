import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

const navItems = [
  "Dashboard",
  "Sources",
  "Articles",
  "Entities",
  "Timeline",
  "Notes",
  "Settings",
];

type Source = {
  id: string;
  name: string;
  url: string;
  category: string | null;
  notes: string | null;
  created_at: string;
};

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading sources:", error);
      } else {
        setSources(data ?? []);
      }

      setLoading(false);
    }

    loadSources();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="text-2xl font-bold tracking-tight">Foundation</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Strategic information workspace
          </p>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="border-b border-zinc-800 bg-zinc-950/80 px-8 py-5">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
              Taiwan Strategic Environment
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Dashboard</h2>
          </header>

          <section className="grid gap-6 p-8 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Sources</p>
              <p className="mt-3 text-3xl font-bold">
                {loading ? "..." : sources.length}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Articles</p>
              <p className="mt-3 text-3xl font-bold">0</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Entities</p>
              <p className="mt-3 text-3xl font-bold">0</p>
            </div>
          </section>

          <section className="px-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="text-lg font-semibold">Connected Sources</h3>

              <div className="mt-4 space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="mt-1 text-sm text-zinc-400">
                          {source.url}
                        </p>
                      </div>
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                        {source.category ?? "Uncategorized"}
                      </span>
                    </div>

                    {source.notes && (
                      <p className="mt-3 text-sm text-zinc-500">
                        {source.notes}
                      </p>
                    )}
                  </div>
                ))}

                {!loading && sources.length === 0 && (
                  <p className="text-sm text-zinc-400">
                    No sources found yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}