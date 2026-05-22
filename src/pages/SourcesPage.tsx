import { useEffect, useState } from "react";
import type { Source } from "../types/source";
import {
  getSources,
  createSource as createSourceRecord,
} from "../services/sourceService";

import { SourceForm } from "../components/SourceForm";
import { SourceList } from "../components/SourceList";

import { PageHeader } from "../components/PageHeader";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSources() {
    try {
      const data = await getSources();
      setSources(data);
    } catch (error) {
      console.error("Error loading sources:", error);
    } finally {
      setLoading(false);
    }
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
    try {
      const data = await createSourceRecord(source);
      setSources((prev) => [data, ...prev]);
    } catch (error) {
      console.error("Error adding source:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Sources"
        description="Add, review, and manage OSINT source records."
      />

      {loading ? (
        <p className="text-slate-400">Loading sources...</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SourceForm onCreateSource={createSource} />
          <SourceList sources={sources} />
        </div>
      )}
    </>
  );
}