import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
      <Sidebar />

      <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
