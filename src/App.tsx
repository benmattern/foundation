const navItems = [
  "Dashboard",
  "Sources",
  "Articles",
  "Entities",
  "Timeline",
  "Notes",
  "Settings",
];

export default function App() {
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
            <h2 className="mt-2 text-3xl font-semibold">
              Dashboard
            </h2>
          </header>

          <section className="grid gap-6 p-8 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Sources</p>
              <p className="mt-3 text-3xl font-bold">0</p>
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
              <h3 className="text-lg font-semibold">Initial Workspace</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Foundation will begin as a structured dashboard for collecting,
                organizing, and analyzing public information related to Taiwan,
                semiconductors, regional security, and strategic technology.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}