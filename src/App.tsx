import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { Source } from "./types/source";

import { Sidebar } from "./components/Sidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardCards } from "./components/DashboardCards";
import { SourceForm } from "./components/SourceForm";
import { SourceList } from "./components/SourceList";

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadSources();
  }, []);

  async function createSource(source: {
    name: string;
    url: string;
    category: string;
    notes: string;
  }) {
    const { data, error } = await supabase
      .from("sources")
      .insert({
        name: source.name,
        url: source.url,
        category: source.category || null,
        notes: source.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding source:", error);
    } else if (data) {
      setSources([data, ...sources]);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8">
        <DashboardHeader />

        <DashboardCards sourceCount={sources.length} />

        {loading ? (
          <p>Loading sources...</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SourceForm onCreateSource={createSource} />
            <SourceList sources={sources} />
          </div>
        )}
      </main>
    </div>
  );
}