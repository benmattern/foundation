import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Project overview", to: "/" },
  { label: "Sources", to: "/sources" },
  { label: "Inbox", to: "/ingestion" },
  { label: "Library", to: "/articles" },
  { label: "Research", to: "/research" },
  { label: "Data Workspace", to: "/data" },
  { label: "Entities", to: "/entities" },
  { label: "Timeline", to: "/events" },
  { label: "Tags", to: "/tags" },
  { label: "Project settings", to: "/project" },
];

export function Sidebar() {
  return (
    <aside className="border-b border-slate-800 bg-slate-950 p-4 text-white lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-6">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <p className="mb-4 text-lg font-bold tracking-wide">FOUNDATION</p>

      <nav
        aria-label="Research navigation"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition ${
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
