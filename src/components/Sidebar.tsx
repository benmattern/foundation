const navItems = [
  "Dashboard",
  "Sources",
  "Articles",
  "Entities",
  "Timeline",
  "Notes",
  "Settings",
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen p-6">
      <h1 className="text-xl font-bold mb-8">FOUNDATION</h1>

      <nav className="space-y-3 text-sm">
        {navItems.map((item) => (
          <div key={item} className="text-slate-300 hover:text-white cursor-pointer">
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}