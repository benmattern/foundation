import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Source } from "../types/source";
import {
  getSourceById,
  updateSource,
} from "../services/sourceService";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";

export default function SourceDetailPage() {
  const { id } = useParams();
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    category: "",
    notes: "",
  });

  useEffect(() => {
    async function loadSource() {
      if (!id) return;

      try {
        const data = await getSourceById(id);
        setSource(data);
        setForm({
          name: data.name,
          url: data.url,
          category: data.category ?? "",
          notes: data.notes ?? "",
        });
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

  async function handleSave() {
    if (!id) return;

    setSaving(true);

    try {
      const updated = await updateSource(id, form);
      setSource(updated);
      setEditing(false);
    } catch (error) {
      console.error("Error updating source:", error);
    } finally {
      setSaving(false);
    }
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
          {editing ? (
            <>
              <div>
                <p className="text-sm text-slate-400 mb-2">Name</p>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">URL</p>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Category</p>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Notes</p>
                <textarea
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 text-white font-medium transition"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-slate-700 px-6 py-3 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-white font-medium transition"
                >
                  Edit Source
                </button>
              </div>

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
            </>
          )}
        </div>
      </Card>
    </>
  );
}