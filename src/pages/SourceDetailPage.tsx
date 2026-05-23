import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Source } from "../types/source";
import { getSourceById } from "../services/sourceService";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";

export default function SourceDetailPage() {
  const { id } = useParams();
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSource() {
      if (!id) return;

      try {
        const data = await getSourceById(id);
        setSource(data);
      } catch (error) {
        console.error("Error loading source:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSource();
  }, [id]);

  if (loading) {
    return <p className="text-slate-400">Loading source...</p>;
  }

  if (!source) {
    return (
      <>
        <PageHeader
          title="Source Not Found"
          description="The requested source could not be loaded."
        />

        <Link to="/sources" className="text-blue-400 hover:text-blue-300">
          Back to Sources
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link to="/sources" className="text-blue-400 hover:text-blue-300">
          ← Back to Sources
        </Link>
      </div>

      <PageHeader
        title={source.name}
        description="Source detail record"
      />

      <Card>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-400">URL</p>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 break-all"
            >
              {source.url}
            </a>
          </div>

          <div>
            <p className="text-sm text-slate-400">Category</p>
            <p className="text-white">{source.category || "Uncategorized"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Notes</p>
            <p className="text-white whitespace-pre-wrap">
              {source.notes || "No notes added."}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Created</p>
            <p className="text-white">
              {source.created_at
                ? new Date(source.created_at).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}