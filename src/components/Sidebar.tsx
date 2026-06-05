import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Sources", to: "/sources" },
  { label: "Articles", to: "/articles" },
  { label: "Tags", to: "/tags" },
  { label: "Events", to: "/events" },
  { label: "Entities", to: "/entities" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen p-6">
      <h1 className="text-xl font-bold mb-8">FOUNDATION</h1>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
