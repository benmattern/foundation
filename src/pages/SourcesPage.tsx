import { useEffect, useState } from "react";
import type { Source } from "../types/source";
import {
  createSource as createSourceRecord,
  getSources,
} from "../services/sourceService";

import { SourceForm } from "../components/SourceForm";
import { SourceList } from "../components/SourceList";

import { PageHeader } from "../components/PageHeader";
import { SourceCatalog } from "../components/SourceCatalog";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSources().then((data) => {
      if (active) setSources(data);
    }).catch((error: unknown) => {
      if (active) console.error(error);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
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
      <SourceCatalog onEnabled={async () => setSources(await getSources())} />

      {loading
        ? <p className="text-slate-400">Loading sources...</p>
        : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SourceForm onCreateSource={createSource} />
            <SourceList sources={sources} />
          </div>
        )}
    </>
  );
}
