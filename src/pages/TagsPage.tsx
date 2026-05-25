import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { TagForm } from "../components/TagForm";
import { TagList } from "../components/TagList";

import type { Tag } from "../types/tag";

import {
  getTags,
  createTag as createTagRecord,
  deleteTag as deleteTagRecord,
} from "../services/tagService";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTags() {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  async function createTag(tag: {
    name: string;
    description: string;
  }) {
    try {
      const data = await createTagRecord(tag);

      setTags((prev) =>
        [...prev, data].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  }

  async function deleteTag(id: string) {
    try {
      await deleteTagRecord(id);

      setTags((prev) =>
        prev.filter((tag) => tag.id !== id)
      );
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Manage topics used to classify intelligence records."
      />

      {loading ? (
        <p className="text-slate-400">Loading tags...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <TagForm onCreateTag={createTag} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <TagList
              tags={tags}
              onDeleteTag={deleteTag}
            />
          </div>
        </div>
      )}
    </div>
  );
}